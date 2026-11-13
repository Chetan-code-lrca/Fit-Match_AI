# FitMatch AI — Production Readiness

Status: **Application integration implemented; external project verification remains mandatory**

## P0 — Required before public launch

- [x] Supabase email/password sign-up and sign-in endpoints.
- [x] HttpOnly access and refresh cookies; SameSite=Lax and Secure in production.
- [x] Server-side identity verification and refresh-token rotation.
- [x] Protected dashboard, upload, suggestions, chat and settings pages.
- [x] Wardrobe API uses the authenticated user JWT; database RLS enforces row ownership.
- [x] Private Storage uploads and expiring signed URLs.
- [x] Runtime wardrobe adapter no longer reads the shared JSON file.
- [x] Mutating endpoints validate Origin and Fetch Metadata.
- [x] Upload MIME/signature checks, 4 MB per-image cap and sequential one-image requests.
- [x] Sharp decoding, 20 MP input ceiling, EXIF orientation handling, 2048 px resize and metadata-free WebP output.
- [x] Atomic PostgreSQL per-user request quotas for wardrobe, upload, chat, recommendations and outfit endpoints.
- [x] Supabase migrations authored for wardrobe RLS, private image storage and the rate-limit RPC.
- [x] Authenticated wardrobe JSON export.
- [x] Identity-bound account deletion Edge Function authored; privileged key is used only in Supabase Functions.
- [ ] Apply all three migrations to a live Supabase project and verify SQL grants, RLS, storage and the rate-limit RPC.
- [ ] Deploy the `delete-account` Edge Function and set `SUPABASE_SERVICE_ROLE_KEY` as a Supabase Function secret only. Never place it in Vercel, Next.js or browser environment variables.
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in encrypted hosting settings.
- [ ] Configure Supabase Auth Site URL, allowed redirect URLs, email confirmation template and SMTP.
- [ ] Configure Supabase Auth provider rate limits and edge/IP throttling for unauthenticated sign-up/sign-in requests.
- [ ] Verify cookies, session refresh, CSRF behaviour and redirect handling on the real domain.

## P1 — Reliability and quality

- [x] CI runs dependency audit (high/critical), lint, typecheck, regression tests and production build.
- [x] Regression tests cover actual image normalization, signatures, auth policy, RLS definitions, rate limit schema and account deletion boundaries.
- [x] Weekly Dependabot updates for npm and GitHub Actions.
- [ ] Integration tests against a staging Supabase project.
- [ ] Two-account isolation test: account A cannot read, modify, delete or sign a URL for account B's data.
- [ ] Playwright tests for sign-up, email confirmation, sign-in, upload, wardrobe CRUD, export, deletion and sign-out.
- [ ] Review and triage remaining moderate npm audit findings in the ESLint dependency tree.
- [ ] Error monitoring, redacted structured logs and uptime alerts.
- [ ] Automated database backups and a successful restore drill.
- [ ] Load tests, database index review and connection-pooling verification.

## P2 — Release and product polish

- [ ] Deploy isolated staging with dedicated credentials and test data.
- [ ] Production deployment with preview gates, smoke tests and rollback procedure.
- [ ] Accessibility, keyboard and mobile-browser QA.
- [ ] Legal review of privacy notice and terms; add operator contact, legal entity and hosting/processing-region disclosures.
- [ ] Define service-level objectives, incident owner and escalation process.

## Provider setup — exact sequence

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to local `.env.local` and encrypted hosting environment settings.
3. Apply all migrations in order using Supabase SQL Editor or CLI:
   - `supabase/migrations/202611130001_initial_schema.sql`
   - `supabase/migrations/202611130002_user_rate_limits.sql`
   - `supabase/migrations/202611130003_storage_upload_limit.sql`
4. Set Supabase Auth Site URL to the app's canonical URL and allow `/auth/confirm` as a redirect.
5. Configure the confirmation email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
6. Enable email/password authentication, configure custom SMTP and set Auth abuse limits.
7. Deploy the account deletion function:
   `supabase functions deploy delete-account --project-ref <project-ref>`
8. Set the service-role key only as an Edge Function secret:
   `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key> --project-ref <project-ref>`
   Do not set this secret in Vercel, Next.js or any `NEXT_PUBLIC_*` variable.
9. Test sign-up, confirmation, sign-in, sign-out, refresh, JSON export and account deletion.
10. Run the two-account isolation test and backup-restore drill in staging.

## Staging acceptance test

Create test accounts A and B. Add distinct wardrobe records and clothing photos to each. Verify A cannot list, fetch, update, delete, or generate signed URLs for B's resources. Confirm rate windows are scoped independently. Repeat after sign-out, refresh-token rotation, expiry and account deletion. Verify the deleted user's objects and Auth account are gone. Finally restore a backup into a clean staging project.

## Known limitations

- Repository CI cannot verify live Auth email delivery, applied SQL grants/RLS, signed URL expiry, real quotas, Edge Function secrets or backups; those require a Supabase project.
- Unauthenticated sign-up/sign-in requests need provider and edge/IP-level throttling in addition to authenticated per-user database limits.
- Sharp normalization is covered by regression tests, but hostile-file testing and staging verification remain required.
- The app uses user JWTs and a publishable key for normal application requests; it does not use a service-role key.
- The privacy notice is a draft, not legal advice or a complete jurisdiction-specific privacy policy.
