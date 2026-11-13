
# Security and production release policy

FitMatch uses Supabase Auth, PostgreSQL Row Level Security and a private Storage bucket. Application data requests use the signed-in user's access token; the app does not require a Supabase service-role key.

## Implemented controls

- Session credentials are stored only in HttpOnly cookies, SameSite=Lax and Secure in production.
- Server-side Auth endpoints verify user identity with Supabase Auth and rotate refresh tokens.
- The application proxy protects private pages. Every data API independently verifies the user.
- Wardrobe records carry user ownership and are protected by database RLS.
- Private Storage objects are namespaced by user UUID and protected by Storage RLS policies.
- Private image reads use expiring signed URLs.
- Uploads enforce file signatures, MIME types and file-size limits.
- Mutating endpoints reject cross-origin requests.
- The application uses a publishable key and each user's JWT, not a service-role key.

## Required provider configuration

- Keep the Supabase project URL and publishable key in encrypted deployment settings.
- Apply the checked-in SQL migration and verify database grants, RLS and bucket policies.
- Configure the Auth Site URL, redirect URLs, confirmation email template and SMTP.
- Configure Auth rate limits and application-level distributed rate limits.

## Remaining release blockers

Full image decoding/re-encoding, metadata stripping, distributed rate limiting, monitoring, backup/restore verification, privacy workflows and two-account staging tests remain release blockers. Do not claim production approval until they are completed and verified.

## Incident response

1. Disable uploads and wardrobe mutations.
2. Revoke affected Supabase sessions and rotate relevant project keys.
3. Preserve redacted logs; never export access tokens, refresh tokens or image contents.
4. Identify affected accounts and objects.
5. Restore from a verified backup only after fixing the root cause.
6. Re-run the account-isolation test before reopening.
