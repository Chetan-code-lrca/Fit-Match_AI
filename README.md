# FitMatch AI

**Wardrobe intelligence for getting more from the clothes you already own.**

FitMatch organises a personal closet, ranks outfit combinations for an occasion, and explains the signals behind each recommendation. It is closet-first: help people use their existing wardrobe before suggesting new purchases.

## Product experience

- Personal wardrobe with category, colour and style metadata.
- Occasion-led outfit discovery for campus, travel, smart casual, streetwear and evening plans.
- Anchor-piece recommendations and a daily outfit edit.
- Stylist chat grounded in the signed-in user's wardrobe.
- Optional OpenAI explanation enrichment; deterministic outfit matching works without it.
- Private account-scoped clothing images and short-lived signed image URLs.
- Wardrobe management, including removing saved pieces.

The match index is a deterministic styling heuristic, not a probability or a trained fashion/vision model:

| Signal | Weight | Meaning |
|---|---:|---|
| Colour harmony | 30% | Compatibility of declared colour families |
| Style coherence | 25% | Compatibility of declared style labels |
| Occasion fit | 30% | Whether pieces are tagged for the chosen setting |
| Versatility | 15% | How many settings each piece can be used for |

Colour extraction runs in the browser. Garment category and style still require user confirmation; automatic garment recognition is not claimed.

## Technology

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Supabase Auth for email/password identity
- Supabase Postgres with row-level security (RLS)
- Supabase private Storage for garment images
- GitHub Actions quality gates, CodeQL and Dependabot

The app uses a **publishable** Supabase API key plus each user's access token. It does not require or accept a `service_role` key.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
git clone https://github.com/Chetan-code-lrca/Fit-Match_AI.git
cd Fit-Match_AI
npm ci
cp .env.example .env.local
npm run dev
```

Private workspace routes intentionally remain unavailable until Supabase is configured and the migration has been applied.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and **publishable** key to `.env.local` as `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
3. Set `APP_ORIGIN=http://localhost:3000` locally. In production, use the exact HTTPS site origin.
4. Run `supabase/migrations/202611130001_production_hardening.sql` in the Supabase SQL Editor.
5. In Authentication → URL Configuration, set the Site URL to your app origin and add the email-confirmation redirect URL: `http://localhost:3000/login?verified=1` locally or `https://YOUR_DOMAIN/login?verified=1` in production.
6. Enable email/password sign-in and configure confirmation email delivery.
7. Ensure the project's Storage upload limit is at least 5 MB. Do not add a public policy to the `wardrobe-private` bucket; the migration creates it as private and adds per-user policies.

Use the publishable key only. Never expose service-role keys, database passwords, SMTP credentials or OpenAI secrets in client code, public variables, commits or screenshots.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs the same gates for pull requests to `main` and pushes to `main`. `GET /api/health` returns HTTP 200 only when Supabase is configured and the database readiness function is reachable; otherwise it returns 503.

## Deployment

1. Connect the repository to Vercel or another Node.js host supporting Next.js 16.
2. Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `APP_ORIGIN` to Preview and Production environments.
3. Add `OPENAI_API_KEY` only when explanation enrichment is wanted.
4. Apply the migration to the target Supabase project and configure the Auth Site URL and redirect allow-list.
5. Deploy a restricted preview. Test sign-up, email confirmation, sign-in, refresh, sign-out, wardrobe create/delete, image upload and two-account isolation. Confirm private images cannot be read without valid signed URLs and `/api/health` is green.
6. Promote only after smoke tests and backup/restore checks pass.

Do not deploy with an unconfigured Supabase project. Private APIs fail closed with 503 when the required backend is missing.

## Security design

- Access and refresh tokens are stored in HttpOnly, SameSite=Lax cookies; Secure is enabled in production.
- The Next.js proxy protects private pages and APIs and refreshes expired sessions.
- Mutating endpoints require a same-origin Origin header and bounded JSON request bodies.
- API handlers verify sessions and use the user's JWT for database and Storage requests.
- RLS is the final ownership boundary; user IDs are never accepted from the client.
- Private image objects live beneath the authenticated user's UUID and use one-hour signed read URLs.
- Signed upload URLs transfer image bytes directly to private Storage, avoiding large application-server request bodies.
- Uploads are limited by count, size and MIME; the server checks stored content type and JPEG/PNG/WEBP signatures.
- Wardrobe writes, uploads, chat and outfit generation are database-rate-limited.
- Personal wardrobe API responses are marked private/no-store.

## Routes

| Route | Purpose |
|---|---|
| `/` | Public product page |
| `/login`, `/signup` | Supabase email/password auth |
| `/dashboard` | Private wardrobe overview |
| `/upload` | Private image upload and garment metadata |
| `/suggestions` | Occasion and anchor-based outfit lab |
| `/chat` | Wardrobe-aware stylist |
| `/settings` | Account wardrobe and service status |
| `/api/health` | Database readiness probe |

## Current release boundary

The repository contains the authentication, data-isolation, private-storage, input-validation, rate-limiting and CI foundation. **A live production launch is not verified** until a real Supabase project is configured, the migration is applied, Auth email/redirect settings are completed, and two-account, storage and backup/restore tests pass.

See [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) for remaining release gates. Outstanding work includes full image decoding/re-encoding, browser E2E tests, exception monitoring, privacy/terms review and account data export/deletion.
