# FitMatch AI — Production Readiness

Status: **Pre-production / release blocked**

This checklist distinguishes implemented safeguards from work that requires external provider setup and staging verification.

## P0 — Must complete before public launch

- [ ] Managed authentication with server-side session verification and secure, HttpOnly, SameSite cookies.
- [ ] Protected application routes and API handlers; no anonymous access to personal wardrobe data.
- [x] Initial PostgreSQL schema migration with user ownership and RLS policies authored (not yet applied to a live project).
- [x] Initial row-level security policies authored for wardrobe rows and private image objects.\n- [ ] Apply migration and verify row-level security with two independent live accounts.
- [ ] Replace the global JSON file adapter; production must never read or write local wardrobe files.
- [ ] Private object storage for original and processed photos.
- [x] Verify upload MIME claims against JPEG, PNG and WebP file signatures.
- [ ] Decode/re-encode uploaded images, enforce pixel/dimension limits and strip metadata.
- [ ] Signed, short-lived image URLs and owner checks on every object operation.
- [x] Fail closed: local filesystem wardrobe and public upload APIs return 503 in production.
- [ ] Validate all API payloads with schemas and reject unexpected fields.
- [ ] Rate limits for authentication, uploads, chat and generation endpoints.
- [ ] CSRF/origin protections for cookie-authenticated write operations.
- [ ] Secrets stored only in encrypted deployment environment variables.

## P1 — Reliability and quality

- [ ] Unit tests for outfit scoring, occasion matching, wardrobe edge cases and malformed inputs.
- [x] Initial regression tests for production storage guard and image signature validation.
- [ ] Integration tests for auth, database policies, upload ownership and signed URL expiry.
- [ ] Playwright smoke tests for sign-in, onboarding, wardrobe CRUD and outfit generation.
- [x] CI runs lint, typecheck, regression tests and production build.
- [ ] Dependency vulnerability review and automated dependency update policy.
- [ ] Error monitoring, structured server logs and uptime alerting.
- [ ] Automated backups plus a tested restore procedure.
- [ ] Database connection pooling and query/index review.

## P2 — Release and product polish

- [ ] Staging deployment with isolated staging data and secrets.
- [ ] Production deployment with preview/staging gates and rollback instructions.
- [ ] Accessibility audit (keyboard, contrast, focus, screen reader).
- [ ] Mobile browser QA and image upload performance checks.
- [ ] Privacy policy, terms, data export and account deletion workflows.
- [ ] User-facing AI disclosure: current outfit scoring is deterministic metadata-based logic, not a trained fashion model.
- [ ] Load test critical API paths and establish performance budgets.

## Verification performed

- Existing CI has previously passed lint and Next.js production build.
- This hardening change adds a health endpoint, signature checks, a production fail-closed guard, and regression checks.
- Passing a build is not equivalent to production approval. P0 provider integration and staging isolation tests remain release blockers.

## Staging acceptance test

Create accounts A and B. Add distinct wardrobe records and images to each. Verify A cannot list, fetch, mutate, delete, or generate signed URLs for B's resources. Repeat after logout, token expiry, and account deletion. Verify backups can be restored into a clean staging environment.
