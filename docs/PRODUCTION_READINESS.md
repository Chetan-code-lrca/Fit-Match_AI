# FitMatch AI — Production Readiness

Status: **Application hardening implemented; live Supabase verification required**

## P0 — Must complete before public launch

- [x] Supabase email/password sign-up and sign-in endpoints.
- [x] HttpOnly access/refresh cookies; SameSite=Lax and Secure in production.
- [x] Server-side identity verification and refresh-token rotation.
- [x] Protected dashboard, upload, suggestions, chat and settings pages.
- [x] Wardrobe APIs use authenticated user tokens; database RLS enforces row ownership.
- [x] Private Storage uploads and expiring signed URLs.
- [x] Runtime wardrobe adapter no longer reads the shared JSON file.
- [x] Mutation Origin and Fetch Metadata checks.
- [x] Upload MIME/signature checks, 4 MB per-image limit and one-image requests (keeps multipart payloads below Vercel's 4.5 MB function limit).
- [x] Sharp decoding, pixel limits, orientation correction, resizing and metadata-free WebP re-encoding.
- [x] Atomic PostgreSQL per-user API quotas for wardrobe, uploads, chat and outfit endpoints; limiter fails closed.
- [x] Migrations define wardrobe RLS, private Storage and rate-limit RPC policies.
- [ ] Apply both migrations to a live Supabase project and verify SQL grants/RLS/RPC execution.
- [ ] Configure Supabase Auth Site URL, redirect URLs, confirmation template and SMTP.
- [ ] Configure encrypted Supabase environment variables in the hosting provider.
- [ ] Configure Supabase Auth abuse limits and edge/IP throttling for unauthenticated sign-up/sign-in traffic.
- [ ] Verify session refresh, cookie and CSRF behaviour on the real production domain.

## P1 — Reliability and quality

- [x] CI runs lint, typecheck, regression tests, production build and high/critical npm audit gate.
- [x] Regression tests cover image signatures/normalization, auth cookies, database RLS and rate-limit policies.
- [x] Weekly Dependabot updates for npm and GitHub Actions.
- [ ] Integration tests against a staging Supabase project.
- [ ] Two-account isolation: account A cannot access, update, delete or sign URLs for account B.
- [ ] Playwright sign-up, sign-in, upload, wardrobe CRUD and sign-out flow.
- [ ] Review and triage remaining moderate npm audit findings in the ESLint toolchain.
- [ ] Error monitoring, structured logs and uptime alerting.
- [ ] Database backups and a successful restore drill.
- [ ] Load test critical routes and review database indexes/connection limits.

## P2 — Release and product polish

- [ ] Staging deployment with isolated data and secrets.
- [ ] Production deployment with preview gates, smoke checks and rollback plan.
- [ ] Accessibility and mobile browser QA.
- [ ] Privacy policy, terms, data export and account deletion workflows.
- [ ] Service-level objectives and incident ownership.

## Provider setup

1. Create a Supabase project.
2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to local .env.local and encrypted hosting settings.
3. Apply both SQL migrations in order: 202611130001_initial_schema.sql, then 202611130002_user_rate_limits.sql.
4. In Auth URL Configuration, set the Site URL to your canonical app URL and add /auth/confirm as an allowed redirect.
5. Configure the email confirmation template to link to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.
6. Enable email/password authentication, configure custom SMTP and set appropriate Supabase Auth rate limits before public launch.
7. Run sign-up, confirmation, sign-in, sign-out and refresh-token checks.
8. Run the two-account isolation test and backup-restore drill in staging.

## Staging acceptance test

Create accounts A and B. Add different wardrobe records and photos to each. Verify A cannot list, fetch, update, delete or create signed image URLs for B's resources. Confirm per-user rate windows do not affect B. Repeat after logout, refresh-token rotation, expiry and account deletion. Verify a backup can be restored into a clean staging project.

## Known limitations

- Image normalization is implemented but still requires hostile-file and staging verification before public launch.
- Authenticated API rate limits use an atomic PostgreSQL function; unauthenticated auth endpoints rely on Supabase Auth provider limits and still need edge/IP-level throttling.
- No service-role key is used. API calls use each user's access token so RLS policies apply.
- Repository CI cannot verify live Auth email delivery, SQL grants, RLS, signed URL expiry, quotas or backups; these require a live Supabase project.
