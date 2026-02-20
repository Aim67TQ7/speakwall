import { withCors } from './_shared/cors';
import { getServiceClient } from './_shared/supabase';
import { ENV } from './_shared/env';
import OpenAI from 'openai';

export const config = { path: '/.netlify/functions/gpt-recommendations' };

export const handler = withCors(async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const { session_id, transcript, wpm, filler } = body;

  if (!transcript) {
    return new Response(JSON.stringify({ error: 'Missing transcript' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY() });
    const totalFillers = (filler || []).reduce((sum: number, f: any) => sum + f.count, 0);
    const fillerSummary = (filler || []).map((f: any) => `"${f.word}" (${f.count}x)`).join(', ');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert public speaking coach. Analyze the speech transcript and metrics. Provide exactly 5 specific, actionable coaching tips. Be encouraging but direct. Format each tip as a brief heading followed by 1-2 sentences of advice.'
        },
        {
          role: 'user',
          content: `Speech Metrics:\n- Words per minute: ${wpm || 'unknown'}\n- Total filler words: ${totalFillers}\n- Filler breakdown: ${fillerSummary || 'none detected'}\n\nTranscript:\n${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const suggestions = completion.choices[0]?.message?.content || 'Unable to generate recommendations.';

    if (session_id) {
      const sb = getServiceClient();
      await sb.from('speakwall_analyses').update({ recommendations: suggestions }).eq('session_id', session_id);
      await sb.from('speakwall_sessions').update({ status: 'completed' }).eq('id', session_id);
    }

    return new Response(JSON.stringify({ suggestions }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Recommendations failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
});

