export const config = { path: '/.netlify/functions/stripe-webhook' };

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  // TODO: verify Stripe signature and update subscription status
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

