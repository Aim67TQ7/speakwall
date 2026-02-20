PublicSpeakingSim

Quickstart
- Prereqs: Node 18+, npm, Netlify account (for deploy), Supabase project (for auth/DB), AWS S3 bucket (for uploads), OpenAI key (for analysis).
- Install: `npm install`
- Dev (web only): `npm run dev` (Next.js on http://localhost:3000)
- Dev (with functions): `netlify dev` (routes `/.netlify/functions/*` locally)

Environment
- Copy `.env.example` to `.env` and fill values. For local Netlify dev, also set vars in your environment.
- Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AWS_*`, `OPENAI_API_KEY`, `STRIPE_*`.

Deploy (Netlify)
- Push to GitHub and connect in Netlify.
- Build command: `npm run build`
- Publish dir: `.next`
- Functions dir: `netlify/functions`
- Plugin: `@netlify/plugin-nextjs`

Database
- Run `db/schema.sql` in Supabase SQL editor.
- Enable RLS is included; adjust policies as needed.

Status
- Auth: Wired to Supabase client-side. Cookies middleware uses a placeholder; switch to Supabase auth helpers in production.
- Recording: WebRTC recorder with 2–5 min guard rails, preview, S3 presigned POST upload (mock if AWS env missing).
- Functions: Presign upload (real if AWS env set), analyze speech (mock metrics), GPT recommendations (stub), Stripe webhook (stub).

Next Steps
- Replace trial counter with server-side usage checks in DB via Netlify functions.
- Implement Whisper transcription and OpenAI recommendations in background functions and persist to `analyses`.
- Add checkout session creation + paywall gating.
- Add history/results views from DB.

