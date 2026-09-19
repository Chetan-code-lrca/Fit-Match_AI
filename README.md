[![FitMatch CI](https://github.com/Chetan-code-lrca/Fit-Match_AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Chetan-code-lrca/Fit-Match_AI/actions/workflows/ci.yml)

# FitMatch AI

FitMatch AI is a Next.js app for building outfit suggestions from a wardrobe. It includes a visual wardrobe flow, outfit scoring, an Outfit of the Day view, and a simple stylist chat.

The recommendation engine is local and rule-based. An optional OpenAI integration can rewrite the explanation shown with generated outfits.

## Features

- Wardrobe dashboard with sample clothing data
- Upload flow for JPG, PNG, and WEBP images
- Client-side dominant-color extraction for uploaded images
- Optional background removal before saving an item
- Outfit suggestions for campus, travel, smart-casual, streetwear, and night-out
- Outfit scoring for color harmony, aesthetic fit, occasion match, and confidence
- Outfit of the Day
- Rule-based stylist chat
- Optional OpenAI-generated styling explanations

## How it works

The main styling logic lives in `src/lib/style-engine.ts`.

It scores clothing combinations using the color palette, item category, style, occasion tags, and the local style profile. The chat route uses the same rule-based engine to turn prompts such as "all-black fit", "college outfit", or "white sneakers" into recommendations.

OpenAI is only used by `/api/generate-outfits` when `OPENAI_API_KEY` is set. The app still works without that key.

## Run locally

You need Node.js and npm.

```bash
git clone https://github.com/Chetan-code-lrca/Fit-Match_AI.git
cd Fit-Match_AI
npm ci
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```bash
npm run lint
npm run build
npm start
```

## Environment variables

Create `.env.local` in the project root.

```text
OPENAI_API_KEY=
```

`OPENAI_API_KEY` is optional. Keep server-side credentials out of source files and never commit `.env.local`.

The repository also contains placeholders for authentication, weather, and Cloudinary integrations, but those services are not wired into the current application flow.

## Main routes

```text
/                    Landing page
/dashboard            Wardrobe dashboard
/upload               Wardrobe upload
/suggestions          Outfit recommendations
/chat                 Stylist chat
/login                Authentication prototype
/settings             Profile/settings UI
```

The app also exposes these API routes:

```text
GET  /api/recommendations
GET  /api/outfit-of-the-day
GET  /api/generate-outfits
POST /api/generate-outfits
POST /api/chat
POST /api/upload
GET  /api/wardrobe
POST /api/wardrobe
DELETE /api/wardrobe
```

## Project structure

```text
src/
├── app/
│   ├── api/
│   ├── chat/
│   ├── dashboard/
│   ├── login/
│   ├── settings/
│   ├── suggestions/
│   └── upload/
├── components/
└── lib/
    ├── color-extractor.ts
    ├── fitmatch-data.ts
    ├── style-engine.ts
    ├── wardrobe-server.ts
    └── wardrobe-visuals.ts
```

## Deployment

FitMatch AI is a standard Next.js application and can be deployed to a Node-compatible host such as Vercel.

For Vercel:

1. Import `Chetan-code-lrca/Fit-Match_AI` as a Next.js project.
2. Use the default build settings.
3. Add `OPENAI_API_KEY` only when OpenAI explanation generation is needed.
4. Deploy from the `main` branch.

There is one important limitation in the current prototype: wardrobe metadata is stored in `data/wardrobe.json` and uploaded images are written under `public/uploads/`. That filesystem storage is suitable for local development, but it is not durable or user-isolated storage for a serverless production deployment. A production version needs persistent object storage and a database before users rely on saved wardrobes or private images.

## Uploads and privacy

The upload endpoint accepts JPG, PNG, and WEBP files. Uploaded files are saved as public files by the current prototype, so do not use private personal photos on a public deployment until authentication and persistent private storage are implemented.

The login screen is currently a front-end prototype. It does not authenticate a user or create a private session.

## Limitations

- Outfit recommendations are generated from hand-written styling rules, not a trained fashion model.
- The stylist chat is rule-based.
- Uploaded image tags are inferred from local image processing and filename information rather than a full clothing-recognition model.
- Authentication is not implemented yet.
- Wardrobe persistence is filesystem-based and not suitable for multi-user production storage.
- Weather, calendar, shopping, voice, and other external integrations are not part of the current working flow.
