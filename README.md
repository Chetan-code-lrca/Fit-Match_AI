
# FitMatch AI

FitMatch AI is a wardrobe intelligence application built with Next.js. It helps people organise clothes they already own, explore combinations for different occasions, and understand the signals behind each outfit suggestion.

## Product direction

- **Wardrobe-first styling:** recommendations use clothes already owned.
- **Explainable matching:** colour, style, occasion and versatility contribute to a visible styling score.
- **Occasion-led discovery:** campus, smart casual, streetwear, travel and evening outfits.
- **Intentional wardrobe building:** understand category coverage and combinations before buying more.

## Product capabilities

- Responsive dashboard, wardrobe gallery and outfit lab.
- Email/password accounts through Supabase Auth.
- Wardrobe records stored in PostgreSQL and restricted by Row Level Security.
- Private clothing image uploads stored in Supabase Storage; Sharp decodes and re-encodes images to metadata-free WebP.
- Expiring signed URLs for private image access.
- Occasion-led outfit recommendations, daily edit and stylist chat.
- Optional OpenAI explanation enrichment.

## Matching approach

The recommendation engine is deterministic metadata-based logic, not a trained vision or fashion model. It scores colour harmony, style coherence, occasion fit and versatility. The result is a relative styling index, not a probability or a guarantee. Automatic garment recognition and fit prediction are not yet implemented.

## Local setup

Requirements: Node.js 22.6+ and npm.

1. Clone the repository and install dependencies with npm ci.
2. Copy .env.example to .env.local.
3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
4. Apply supabase/migrations/202611130001_initial_schema.sql to the Supabase project.
5. Configure Supabase Auth URLs and the email confirmation template (see below).
6. Run npm run dev.

Open http://localhost:3000.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and publishable key into .env.local and your hosting provider's encrypted environment variables.
3. Apply the SQL migration in Supabase SQL Editor or with the Supabase CLI.
4. In Authentication → URL Configuration, set the Site URL to the canonical application URL and allow the /auth/confirm redirect.
5. Configure the confirmation email template to link to:
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
6. Enable email/password authentication. Configure custom SMTP before public launch.
7. Test sign-up, confirmation, sign-in, sign-out and refresh-token rotation.

The application uses the user's access token with Supabase Auth, PostgREST and Storage. It does not require a service-role key.

## Quality checks

Run npm run lint, npm run typecheck, npm test and npm run build. The npm run check script runs the full sequence. GitHub Actions runs the same gates on pull requests and main-branch pushes.

## API

- GET /api/health — non-sensitive liveness endpoint.
- GET /api/auth/session
- POST /api/auth/sign-in, POST /api/auth/sign-up, POST /api/auth/sign-out
- GET|POST|DELETE /api/wardrobe
- POST /api/upload
- GET /api/recommendations, GET /api/outfit-of-the-day
- GET|POST /api/generate-outfits, POST /api/chat

## Security and release status

The code path for Auth, PostgreSQL access, RLS-owned wardrobe records and private image storage is implemented. **Public production approval is still blocked** until the migration is applied to a real Supabase project, email delivery is configured, full image decoding/re-encoding and rate limiting are added, monitoring/backups are configured, and two-account isolation is verified in staging.

See SECURITY.md and the production readiness checklist. Do not remove release checks or deploy with missing Supabase settings as a workaround.
