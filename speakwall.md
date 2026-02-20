PublicSpeakingSim - Development Task List
App Summary
PublicSpeakingSim is an AI-powered public speaking coach that provides real-time feedback on presentation skills. Users record 2-5 minute practice speeches via webcam, receiving instant analysis on verbal fillers, pacing, volume consistency, and eye contact. The platform transforms nervous speakers into confident presenters through data-driven insights and personalized recommendations.
Monetization Strategy
Core Revenue Stream

Freemium SaaS: $15/month after 3-session trial
Conversion target: 8-12% trial-to-paid

Expansion Opportunities

Tier 2 Pro ($39/month): Unlimited sessions, advanced analytics, custom vocabulary tracking
Team Plans ($99/month): 5 seats, admin dashboard, progress tracking
Enterprise: Custom pricing, SSO, API access, white-label options
One-time purchases:

Professional speech templates ($19)
Industry-specific coaching packs ($29)
Certification prep courses ($149)


B2B Partnerships: Corporate training platforms, universities, bootcamps

Required Service Connectors & Setup Instructions
1. Supabase (Auth & Database)
bash# Create project at supabase.com
# Get these from Settings > API:
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
2. AWS S3 (Recording Storage)
bash# Create bucket in AWS Console
# IAM user needs: s3:PutObject, s3:GetObject, s3:DeleteObject
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=publicspeaking-recordings
AWS_REGION=us-east-1
3. OpenAI (Whisper & GPT)
bash# Get from platform.openai.com
OPENAI_API_KEY=sk-...
# Use: whisper-1 for transcription, gpt-4-turbo for recommendations
4. Stripe (Payments)
bash# From dashboard.stripe.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_... # Create in Stripe Dashboard
5. Netlify Deployment Setup
bash# GitHub Repository Setup
1. Push code to GitHub repo
2. Connect repo to Netlify (app.netlify.com)
3. Build settings:
   - Build command: npm run build
   - Publish directory: .next
   - Functions directory: netlify/functions

# Environment Variables (Set in Netlify Dashboard > Site Settings > Environment Variables)
FRONTEND_URL=https://yourdomain.netlify.app
BACKEND_URL=https://yourdomain.netlify.app/.netlify/functions

# netlify.toml configuration file (root directory):
toml[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NEXT_CONFIG_ENV = "production"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
6. PostgreSQL (via Supabase)
bash# Automatically provided by Supabase
# Or use Netlify's PostgreSQL add-on
DATABASE_URL=postgresql://user:password@host:5432/dbname
7. Netlify Functions Setup (Serverless Backend)
bash# Create netlify/functions directory
# Each function file exports a handler
# Example: netlify/functions/analyze-speech.js
Phase 1: Foundation & Auth (Day 1)

 Initialize Next.js project with TypeScript
 Setup Supabase project and configure auth tables
 Implement auth flow (signup/login/logout pages)
 Create protected route middleware
 Add session tracking for free trial (3 sessions limit)
 Setup environment variables structure
 Configure netlify.toml for deployment settings

Phase 2: Backend Infrastructure (Day 1-2)

 Create Netlify Functions structure (netlify/functions/)
 Configure PostgreSQL schema (users, sessions, recordings, analyses)
 Setup S3 bucket and generate presigned URLs function
 Create recording metadata API functions
 Implement session count validation logic
 Setup CORS headers in Netlify functions

Phase 3: Recording Interface (Day 2)

 Build WebRTC recording component with start/stop controls
 Implement 2-5 minute timer with visual countdown
 Create upload progress indicator
 Add recording preview before submission
 Handle recording state management (Redux/Zustand)
 Implement error handling for browser permissions

Phase 4: Analysis Pipeline (Day 3)

 Create Netlify function for OpenAI Whisper transcription
 Build filler word detection service (regex patterns for um, uh, like, you know)
 Calculate speech pace metrics (WPM calculation)
 Implement audio volume analysis (Web Audio API)
 Setup MediaPipe FaceMesh for gaze tracking (client-side)
 Create background function for async processing

Phase 5: Results Dashboard (Day 3-4)

 Design results page layout with metric cards
 Implement data visualization for metrics
 Create Netlify function for GPT recommendations
 Add session history view
 Create exportable PDF report option
 Build comparison view (progress over time)

Phase 6: Monetization (Day 4)

 Setup Stripe account and products
 Implement subscription checkout flow
 Create Netlify function for Stripe webhooks
 Build paywall component for trial expiry
 Add subscription management page
 Implement usage-based access control

Phase 7: Admin & Deploy (Day 5)

 Create admin dashboard with user metrics
 Implement usage analytics functions
 Connect GitHub repo to Netlify
 Configure environment variables in Netlify dashboard
 Setup monitoring (Sentry integration)
 Test production build and functions

Key Implementation Notes

Use Supabase Row Level Security for multi-tenancy
Implement chunked upload for large video files
Cache analysis results in PostgreSQL
Use Netlify Background Functions for long-running tasks
Keep free tier users' data for conversion tracking
Leverage Netlify's edge functions for performance-critical operations