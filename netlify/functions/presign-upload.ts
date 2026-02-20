// presign-upload is no longer needed — uploads go directly to Supabase Storage
// from the frontend using the authenticated client.
// This file is kept as a no-op to avoid 404s if anything references it.

import { withCors } from './_shared/cors';

export const config = { path: '/.netlify/functions/presign-upload' };

export const handler = withCors(async () => {
  return new Response(JSON.stringify({ error: 'Deprecated. Use Supabase Storage directly.' }), {
    status: 410, headers: { 'Content-Type': 'application/json' }
  });
});
