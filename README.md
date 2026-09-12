# FitMatch AI

FitMatch AI is a Next.js prototype for wardrobe-based outfit recommendations and styling guidance.

The application combines a local rule-based styling engine with optional OpenAI assistance for generating short explanations for outfit suggestions.

## What it includes

- Wardrobe dashboard and item selection
- Outfit suggestions for campus, travel, smart-casual, streetwear, and night-out use
- Outfit scoring based on color harmony, aesthetics, and occasion fit
- Outfit of the Day generation
- Rule-based stylist chat
- Optional OpenAI explanation enrichment
- Wardrobe upload UI

## How recommendations work

The core recommendation engine is deterministic. It ranks wardrobe combinations using color similarity, palette compatibility, item category, favorite-color preferences, occasion compatibility, and scoring rules in `src/lib/style-engine.ts`.

It is not a trained fashion model.

## OpenAI integration

OpenAI is optional. When `OPENAI_API_KEY` is configured, the outfit-generation route uses the API to improve the wording of the generated styling explanations. The local recommendation engine works without an OpenAI key.

The login flow and several personalization/storage pieces are still prototype-level and use local/static data.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Next.js Route Handlers
- Optional OpenAI API

## Run locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/Chetan-code-lrca/Fit-Match_AI.git
cd Fit-Match_AI
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The available variables are for optional authentication, OpenAI, weather, and image-storage integrations:

```text
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
WEATHER_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Leave unused integrations empty. Never commit real credentials.

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   └── generate-outfits/
│   ├── chat/
│   ├── dashboard/
│   ├── login/
│   ├── settings/
│   ├── suggestions/
│   └── upload/
├── components/
└── lib/
    ├── config.ts
    ├── fitmatch-data.ts
    └── style-engine.ts
```

## Build and lint

```bash
npm run lint
npm run build
```

## Public data and uploads

The repository contains sample wardrobe data. Local uploaded files are part of the prototype storage flow; do not use real private wardrobe photos or personal profile data in a public deployment without adding appropriate storage and access controls.

## Limitations

Recommendation quality comes from hand-written styling rules and the sample wardrobe data. External services depend on their own configuration and availability.
