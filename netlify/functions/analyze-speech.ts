import { withCors } from './_shared/cors';
import { getServiceClient } from './_shared/supabase';
import { ENV } from './_shared/env';
import OpenAI from 'openai';

export const config = { path: '/.netlify/functions/analyze-speech' };

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'right', 'er', 'ah'];

export const handler = withCors(async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const { session_id, recording_key } = body;

  if (!session_id || !recording_key) {
    return new Response(JSON.stringify({ error: 'Missing session_id or recording_key' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const sb = getServiceClient();
  await sb.from('speakwall_sessions').update({ status: 'processing' }).eq('id', session_id);

  try {
    // Download from Supabase Storage
    const { data: fileData, error: dlError } = await sb.storage
      .from('speakwall-recordings')
      .download(recording_key);
    if (dlError || !fileData) throw new Error(dlError?.message || 'Failed to download recording');

    const arrayBuf = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Transcribe with Whisper
    const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY() });
    const file = new File([buffer], 'recording.webm', { type: 'video/webm' });
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'verbose_json'
    });

    const transcript = transcription.text;
    const durationSec = transcription.duration || 0;

    // Calculate metrics
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;
    const wpm = durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0;
    const lower = transcript.toLowerCase();
    const fillerCounts = FILLER_WORDS
      .map(w => ({
        word: w,
        count: (lower.match(new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'g')) || []).length
      }))
      .filter(f => f.count > 0);
    const totalFillers = fillerCounts.reduce((sum, f) => sum + f.count, 0);

    // Store analysis
    const { data: analysis } = await sb
      .from('speakwall_analyses')
      .insert({ session_id, words_per_minute: wpm, filler: fillerCounts, transcript })
      .select('id').single();

    await sb.from('speakwall_sessions')
      .update({ status: 'analyzed', duration_sec: Math.round(durationSec) })
      .eq('id', session_id);

    return new Response(JSON.stringify({
      analysis_id: analysis?.id, transcript, wpm, filler: fillerCounts, total_fillers: totalFillers, duration_sec: Math.round(durationSec)
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    await sb.from('speakwall_sessions').update({ status: 'failed' }).eq('id', session_id);
    return new Response(JSON.stringify({ error: e?.message || 'Analysis failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
});

