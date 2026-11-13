# FitMatch AI — Production readiness

This checklist separates repository implementation from external configuration and live verification. A successful build does not prove data isolation or production readiness.

## P0 — Required before public launch

### Implemented in the repository
- [x] Email/password sign-up and sign-in backed by Supabase Auth.
- [x] HttpOnly session cookies; Secure in production; refresh handling and sign-out.
- [x] Proxy protection for private pages and APIs; fail-closed behaviour without Supabase configuration.
- [x] API-level session verification and same-origin checks on mutations.
- [x] Postgres schema with per-user row-level security ownership policies.
- [x] Private image bucket with per-user object policies.
- [x] Short-lived signed direct uploads, avoiding large Next.js function request bodies.
- [x] Server verification of stored MIME, byte size and JPEG/PNG/WEBP file signatures.
- [x] Wardrobe payload validation and owner-scoped storage-key validation.
- [x] Per-user database rate limits for wardrobe changes, uploads, chat and outfit generation.
- [x] Publishable Supabase key only; no service-role key used by the app.
- [x] Security response headers and a database readiness endpoint.
- [x] CI quality gates for tests, TypeScript, ESLint and production build.

### External setup and live verification still required
- [ ] Create Supabase project and configure the exact application origin.
- [ ] Apply `supabase/migrations/202611130001_production_hardening.sql`.
- [ ] Configure email/password Auth, confirmation email delivery, Site URL and redirect allow-list.
- [ ] Configure hosting environment variables for Preview and Production; inspect client bundles for accidental secrets.
- [ ] Verify sign-up, email verification, sign-in, session refresh and sign-out with two independent accounts.
- [ ] Prove account A cannot read, update or delete account B's wardrobe rows or image objects.
- [ ] Verify private bucket access is denied without a valid short-lived signed URL.
- [ ] Test valid uploads, oversized files, unsupported MIME, MIME spoofing and truncated files.
- [ ] Confirm `GET /api/health` returns 200 after migration and 503 when the database is unavailable.
- [ ] Configure backups/PITR appropriate to the chosen plan and perform a restore drill.

## P1 — Required for a dependable public service
- [ ] Add image decoding/re-encoding and pixel/dimension limits. Signature checks are an initial file-type filter, not full image sanitisation.
- [ ] Add browser E2E tests for sign-up, protected routes, wardrobe CRUD and private uploads.
- [ ] Add exception monitoring and alerting with PII/token scrubbing.
- [x] Add draft privacy and terms pages.
- [ ] Complete legal/privacy review, add the operator's legal name and monitored support contact, define retention periods, and publish the final policy/terms.
- [x] Add account data export and account deletion endpoints with owner-scoped Storage cleanup.
- [ ] Verify account export and deletion with real Supabase accounts; confirm Auth deletion cascades and Storage objects are removed.
- [ ] Add CAPTCHA and review Auth/email abuse controls before public sign-up.
- [ ] Complete accessibility checks and test mobile layouts on real devices.
- [ ] Define support/contact, incident response and dependency-update ownership.

## P2 — Product quality and scale
- [ ] Load test database/RLS, signed-image delivery and recommendation routes.
- [ ] Add privacy-aware analytics with consent; never include wardrobe images in analytics payloads.
- [ ] Evaluate learned ranking only against a labelled dataset; keep explanations auditable.
- [ ] Add lifecycle cleanup for orphaned uploads and stale image metadata.
- [ ] Exercise staged rollbacks and publish release notes for each production release.

## Release rule

Keep public sign-up closed until all P0 external setup and live-verification items pass. Use synthetic wardrobe data in restricted preview environments until then.
