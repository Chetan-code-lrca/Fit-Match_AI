# FitMatch AI

FitMatch AI is a wardrobe intelligence app built with Next.js. It helps people organise clothes they already own, explore combinations for different occasions, and understand the signals behind each outfit suggestion.

## Product direction

FitMatch is designed around making an existing wardrobe more useful — not turning every styling interaction into a shopping recommendation.

The product focuses on four ideas:

- **Wardrobe-first styling:** outfit suggestions use saved wardrobe pieces when available.
- **Explainable matching:** every combination is ranked using visible colour, style, occasion and versatility signals.
- **Occasion-led discovery:** explore a closet for campus, smart casual, streetwear, travel and evening plans.
- **Intentional wardrobe building:** understand category coverage and the possible combinations already available before buying more.

## Current features

- Responsive landing page, navigation and wardrobe dashboard
- Starter wardrobe preview for first-time exploration
- JPG, PNG and WEBP clothing uploads
- Client-side dominant-colour extraction and optional background removal
- Wardrobe gallery grouped by clothing category
- Outfit lab with occasion selection and optional anchor piece
- Outfit recommendations from the saved wardrobe, with a starter-data fallback
- Deterministic styling explanations and match breakdown
- Stylist chat using the same wardrobe-aware recommendation engine
- Optional OpenAI explanation enrichment when OPENAI_API_KEY is configured

## Matching approach

The current recommendation engine is a deterministic, metadata-based heuristic — it is not a trained vision or fashion model. Its overall match score is composed of:

| Signal | Weight | What it measures |
|---|---:|---|
| Colour harmony | 30% | Compatibility of the declared colour palettes |
| Style coherence | 25% | Compatibility of declared style labels |
| Occasion fit | 30% | Whether each piece is tagged for the selected occasion |
| Versatility | 15% | How many occasions the pieces are tagged for |

The score is a relative styling index, not a probability or a guarantee that an outfit will suit a person. Upload tagging still relies on the existing local image-processing and filename-based flow; it does not automatically recognise every garment attribute.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
git clone https://github.com/Chetan-code-lrca/Fit-Match_AI.git
cd Fit-Match_AI
npm ci
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run lint
npm run build
npm start
```

## Environment variables

Create .env.local in the project root.

```text
OPENAI_API_KEY=
```

The key is optional. Without it, outfit matching and deterministic explanations continue to work. Keep secrets out of source control.

## Routes

| Route | Purpose |
|---|---|
| / | Product landing page |
| /dashboard | Wardrobe overview and daily edit |
| /upload | Upload and save wardrobe pieces |
| /suggestions | Occasion and anchor-based recommendations |
| /chat | Stylist chat |
| /settings | Configuration and integration status |

## API routes

- GET /api/recommendations
- GET /api/outfit-of-the-day
- GET or POST /api/generate-outfits
- POST /api/chat
- POST /api/upload
- GET, POST or DELETE /api/wardrobe

## Important prototype limitations

The current storage layer is still a local filesystem prototype:

- Wardrobe metadata is stored in data/wardrobe.json.
- Uploaded photos are written beneath public/uploads, so they are public files.
- There is no implemented authentication or user-isolated wardrobe storage.
- Filesystem persistence is not durable across typical serverless deployments.
- Live weather, calendar planning, garment recognition and shopping integrations are not connected.

Do not deploy this version as a multi-user production wardrobe service or upload sensitive personal photos to a public deployment. A production release needs authentication, per-user database records, private object storage, access controls and deployment-specific persistent storage.

## CI

GitHub Actions runs npm ci, ESLint and a Next.js production build for pull requests into main and pushes to main.
