import { withCors } from './_shared/cors';
import { getServiceClient } from './_shared/supabase';
import { ENV } from './_shared/env';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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
    // Download from S3
    const s3 = new S3Client({
      region: ENV.AWS_REGION(),
      credentials: { accessKeyId: ENV.AWS_ACCESS_KEY_ID(), secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY() }
    });
    const s3Resp = await s3.send(new GetObjectCommand({ Bucket: ENV.AWS_BUCKET_NAME(), Key: recording_key }));
    const audioBytes = await s3Resp.Body?.transformToByteArray();
    if (!audioBytes) throw new Error('Failed to download recording from S3');

    // Transcribe with Whisper
    const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY() });
    const file = new File([audioBytes], 'recording.webm', { type: 'video/webm' });
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

