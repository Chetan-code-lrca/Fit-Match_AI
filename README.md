# FitMatch AI

FitMatch AI is a premium, mobile-friendly wardrobe assistant built with **Next.js**, **React**, **Tailwind CSS**, and **Framer Motion**. It turns uploaded outfit photos into a personal styling experience with wardrobe tagging, outfit scoring, AI chat prompts, and an Outfit of the Day generator.

## Included MVP

- Landing page
- Login/Register experience
- Dashboard
- Upload Wardrobe
- Outfit Suggestions
- AI Stylist Chat
- Profile Settings
- API routes for recommendations, chat, uploads, and outfit-of-the-day

## Product highlights

- **Personal AI stylist feel** with wardrobe-aware recommendation cards
- **Color theory logic** for monochrome, neutral balancing, and complementary styling
- **Outfit scoring** across aesthetics, color harmony, occasion fit, and confidence
- **Upload-ready flow** for JPG, PNG, and WEBP wardrobe photos
- **Responsive dark UI** with smooth motion and card-based layout
- **Future-ready architecture** for weather, calendar planning, voice, travel packing, and shopping integrations

## Tech stack

- **Frontend:** Next.js App Router, React, Tailwind CSS, Framer Motion
- **Backend:** Next.js Route Handlers
- **AI-ready services:** OpenAI, Cloudinary/Firebase Storage, Google auth via environment variables

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Create `.env.local` with the values you plan to use in production:

```bash
AUTH_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
WEATHER_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The UI shows integration readiness automatically when these values are missing or configured.

## Project structure

```text
src/
  app/
    api/
    chat/
    dashboard/
    login/
    settings/
    suggestions/
    upload/
  components/
  lib/
public/
```

## Deployment

### Vercel

- Import the repository into Vercel
- Set the environment variables listed above
- Deploy the Next.js application

### Render or Railway

- Use `npm install && npm run build`
- Start with `npm run start`
- Configure the same environment variables as Vercel

## Validation

Use the existing scripts:

```bash
npm run lint
npm run build
```

