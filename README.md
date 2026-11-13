# FitMatch AI

FitMatch AI is a wardrobe intelligence app built with Next.js. It helps people organise clothes they already own, explore combinations for different occasions, and understand the signals behind each outfit suggestion.

## Product direction

FitMatch is designed around making an existing wardrobe more useful — not turning every styling interaction into a shopping recommendation.

- **Wardrobe-first styling:** recommendations use the clothes already in a user's closet.
- **Explainable matching:** colour, style, occasion and versatility contribute to a visible styling score.
- **Occasion-led discovery:** campus, smart casual, streetwear, travel and evening outfits.
- **Intentional wardrobe building:** surface gaps and combinations before encouraging another purchase.

## Current product capabilities

- Responsive editorial-style application shell and wardrobe dashboard.
- Starter wardrobe for local exploration.
- JPG, PNG and WEBP image upload with MIME and file-signature checks.
- Wardrobe gallery, outfit lab, anchor-piece recommendations and stylist chat.
- Deterministic styling explanations and match breakdown.
- Optional OpenAI explanation enrichment.

## Matching approach

The recommendation engine is deterministic metadata-based logic, not a trained vision or fashion model.

| Signal | Weight | Meaning |
|---|---:|---|
| Colour harmony | 30% | Compatibility of declared colour palettes |
| Style coherence | 25% | Compatibility of declared style labels |
| Occasion fit | 30% | Whether pieces match the selected occasion |
| Versatility | 15% | Number of occasions supported by the pieces |

The result is a relative styling index, not a probability or a guarantee. Automatic garment recognition and fit prediction are not yet implemented.

## Run locally

Requirements: Node.js 22 and npm.

```bash
git clone https://github.com/Chetan-code-lrca/Fit-Match_AI.git
cd Fit-Match_AI
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or run the full sequence
npm run check
```

GitHub Actions runs lint, typecheck, regression tests and a production build for pull requests and main-branch pushes.

## API

- `GET /api/health` — non-sensitive service health.
- `GET /api/recommendations`
- `GET /api/outfit-of-the-day`
- `GET|POST /api/generate-outfits`
- `POST /api/chat`
- `POST /api/upload`
- `GET|POST|DELETE /api/wardrobe`

## Security and production status

**This repository is not yet approved for public multi-user production.** The current wardrobe implementation uses a shared local JSON file and local uploads. A production deployment without account isolation could expose user data.

As a safety measure, wardrobe, upload, chat and recommendation APIs return HTTP 503 in production until an authenticated, user-scoped persistence and private image-storage adapter replaces the prototype filesystem implementation. Local development remains available. Do not remove this release guard as a deployment workaround.

See [SECURITY.md](./SECURITY.md) and the [production readiness checklist](./docs/PRODUCTION_READINESS.md) for the architecture, P0 blockers, staging acceptance test and incident response requirements.

## Planned production architecture

- Managed authentication with server-side session verification.
- PostgreSQL with per-user row-level security and repeatable migrations.
- Private object storage with image decoding/re-encoding and signed URLs.
- API schema validation, rate limiting, CSRF/origin protection and safe errors.
- Monitoring, backup/restore drills, staging verification and rollback procedure.

## Environment variables

The only optional integration currently used by the application is:

```text
OPENAI_API_KEY=
```

Keep secrets out of source control and configure deployment secrets through the hosting provider. Never expose database-owner or service-role keys in browser variables.
