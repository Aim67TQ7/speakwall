export function withCors(fn: (event: any) => Promise<Response> | Response) {
  return async function handler(event: any) {
    if (event.httpMethod === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const res = await fn(event);
    const headers = new Headers(res.headers);
    corsHeaders().forEach((v, k) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  };
}

export function corsHeaders() {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
}

