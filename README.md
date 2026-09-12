# FitMatch AI

FitMatch AI is a Next.js prototype for generating wardrobe-based outfit recommendations and lightweight styling guidance.

The application combines a local rule-based styling engine with an optional OpenAI integration for improving the wording of generated outfit explanations.

## What it includes

- Responsive wardrobe dashboard
- Wardrobe item browsing and selection
- Outfit recommendations based on color palette and wardrobe categories
- Occasion-aware recommendations for campus, travel, smart-casual, streetwear, and night-out use cases
- Outfit-of-the-day generation
- Rule-based stylist chat
- Optional OpenAI-powered explanation enrichment
- Upload-oriented wardrobe UI

## How recommendations work

The core recommendation engine is deterministic rather than a trained machine-learning model. It scores combinations using factors such as:

- color similarity and palette compatibility
- item category
- favorite-color boosts from the local sample profile
- occasion compatibility
- aesthetic and color-harmony scores

The resulting recommendations are sorted by a confidence-style score.

## AI integration

OpenAI is optional. When `OPENAI_API_KEY` is available, the outfit-generation route sends generated outfit combinations to OpenAI to produce short styling explanations.

The core recommendation system continues to work without the key.

> Note: this repository should not be presented as an end-to-end production authentication or personalization platform. Several flows are currently prototype-level UI and local/static data.

## Tech stack

- **Framework:** Next.js App Router
- **UI:** React, Tailwind CSS
- **Animation:** Framer Motion
- **Language:** TypeScript
- **Optional AI:** OpenAI API

## Getting started

### Requirements

- Node.js
- npm

### Install

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

The repository includes `.env.example` with placeholders for optional integrations:

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

Never commit real secrets to `.env.example`, source files, screenshots, or documentation.

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

## Validation

Use the project scripts before pushing changes:

```bash
npm run lint
npm run build
```

## Privacy and public-repository hygiene

The public repository contains sample wardrobe data and UI code. Do not commit real wardrobe photos, private profile data, credentials, local filesystem paths, private deployment URLs, or other personal information.

The login page is currently a frontend/prototype experience; environment-variable readiness does not by itself mean that authentication is fully implemented.

## Limitations

This is an evolving prototype. Recommendation quality is based on hand-written heuristics and the included wardrobe data rather than a trained fashion model. External services are optional and may require their own accounts, quotas, and configuration.
