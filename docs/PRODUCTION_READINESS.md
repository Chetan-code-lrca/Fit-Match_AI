
# FitMatch AI — Production Readiness

Status: **App integration implemented; live provider verification required**

## P0 — Must complete before public launch

- [x] Supabase email/password sign-up and sign-in endpoints.
- [x] HttpOnly access and refresh cookies; SameSite=Lax and Secure in production.
- [x] Server-side identity verification and refresh-token rotation.
- [x] Protected dashboard, upload, suggestions, chat and settings pages.
- [x] Wardrobe API uses authenticated user tokens; database RLS enforces row ownership.
- [x] Private object uploads and expiring signed URLs.
- [x] Runtime wardrobe adapter no longer reads the shared JSON file.
- [x] Mutation Origin and Fetch Metadata checks.
- [x] Upload MIME, file-signature and file-size checks.
- [x] Migration defines per-user RLS and a private Storage bucket.
- [ ] Apply migration to a real Supabase project and verify table grants and RLS.
- [ ] Configure Supabase Auth Site URL, allowed redirect URLs, confirmation email template and SMTP.
- [ ] Set encrypted Supabase environment variables in the hosting provider.
- [ ] Full image decode/re-encode, pixel-dimension limits and metadata stripping.
- [ ] Distributed rate limits for auth, uploads, chat and outfit generation.
- [ ] Verify session refresh and CSRF behaviour on the real production domain.

## P1 — Reliability and quality

- [x] CI runs lint, TypeScript typecheck, regression tests and production build.
- [x] Regression tests cover image signatures, auth cookie policy, database RLS policy definitions and adapter wiring.
- [ ] Integration tests against a staging Supabase project.
- [ ] Two-account isolation: account A cannot access, update, delete or sign URLs for account B.
- [ ] Playwright flow for sign-up, sign-in, upload, wardrobe CRUD and sign-out.
- [x] Next.js/React runtime packages upgraded to patched releases; high/critical npm audit gate and weekly Dependabot updates configured.\n- [ ] Review and triage remaining moderate npm audit findings in the lint toolchain.
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
3. Apply supabase/migrations/202611130001_initial_schema.sql with Supabase SQL Editor or the Supabase CLI.
4. In Auth URL Configuration, set the Site URL to your canonical app URL and add /auth/confirm as an allowed redirect.
5. Configure the email confirmation template to link to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.
6. Enable email/password authentication and configure custom SMTP before public launch.
7. Run sign-up, confirmation, sign-in, sign-out and refresh-token checks.
8. Run the two-account isolation test and backup-restore drill in staging.

## Staging acceptance test

Create accounts A and B. Add different wardrobe records and photos to each. Verify A cannot list, fetch, update, delete or create signed image URLs for B's resources. Repeat after logout, refresh-token rotation, expiry and account deletion. Verify a backup can be restored into a clean staging project.

## Known limitations

- Upload image decoding, resizing and metadata stripping are implemented, but still require hostile-file and staging verification before public launch.
- No service-role key is used. API calls use each user's access token so RLS policies apply.
- Repository CI cannot verify live Auth email delivery, SQL grants, RLS, signed URL expiry or backups; these require a live Supabase project.
