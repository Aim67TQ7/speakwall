import { withCors } from './_shared/cors';
import { getServiceClient } from './_shared/supabase';

export const config = { path: '/.netlify/functions/recording-metadata' };

const MAX_FREE_SESSIONS = 3;

export const handler = withCors(async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const { recording_key, duration_sec, user_id } = body;

  if (!recording_key || !user_id) {
    return new Response(JSON.stringify({ error: 'Missing recording_key or user_id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const sb = getServiceClient();

  // Trial enforcement
  const { count } = await sb
    .from('speakwall_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id);

  if ((count ?? 0) >= MAX_FREE_SESSIONS) {
    return new Response(JSON.stringify({ error: 'Trial limit reached. Please upgrade.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await sb
    .from('speakwall_sessions')
    .insert({ user_id, recording_key, duration_sec: duration_sec || null, status: 'uploaded' })
    .select('id')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, session_id: data.id }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
});

