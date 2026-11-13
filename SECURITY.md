# Security and production release policy

## Current release status

FitMatch AI is **not approved for public multi-user production** yet. The current wardrobe adapter stores records in a local JSON file and the upload adapter writes into the public directory. Those adapters are useful for local development only.

To prevent accidental exposure, the wardrobe and upload API routes return HTTP 503 whenever `NODE_ENV=production`. Do not remove this guard to make a deployment appear healthy.

## Required production architecture

- Authentication: Supabase Auth (or an equivalent managed OIDC provider); verify sessions on the server.
- Authorization: every wardrobe row must be scoped to the authenticated user; enforce this with database row-level security, not only UI checks.
- Database: managed PostgreSQL with migrations, backups and least-privilege credentials.
- Images: private object storage; validate file signatures and decode/re-encode images; serve short-lived signed URLs.
- API: schema validation, request-size limits, per-user rate limits, CSRF/origin protection for cookie-authenticated mutations, safe error responses.
- Operations: structured logs without tokens or image contents, error monitoring, uptime checks, backup-restore drills and rollback procedure.

## Required secrets

Never commit secrets. Configure provider credentials only in the deployment platform's encrypted environment settings. The public browser bundle must never receive service-role or database-owner credentials.

## Release gate

A release is blocked until all P0 items in `docs/PRODUCTION_READINESS.md` are implemented and verified in a staging environment with at least two test accounts. The test must prove that one account cannot read, update, delete or obtain signed image URLs for another account's data.

## Incident response

1. Disable uploads and wardrobe mutations.
2. Revoke affected provider keys and sessions.
3. Preserve redacted logs and identify impacted accounts.
4. Restore from a verified backup only after fixing the root cause.
5. Document the incident and verify isolation before reopening.
