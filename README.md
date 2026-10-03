# Poymal

Poymal is a mobile-first social logbook for anglers. People sign in, post catches, follow other anglers, and explore fishing spots on a map. The interface is built as a phone-width app: on a desktop it sits in a centered column, and on a phone it uses the full screen, including safe areas.

## Features

- Home feed of public catches, with a Following filter
- Profiles, follows, likes, comments, and saved posts
- Catch logging with photos, species, measurements, bait, and weather
- Map of your spots and community activity, with saved locations and place search
- Species identification from a photo
- PRO access for exact community coordinates and a higher identification allowance

## Stack

- [Next.js](https://nextjs.org) App Router and React
- [Prisma](https://www.prisma.io) with PostgreSQL
- [Supabase](https://supabase.com) Auth and Storage
- [Mapbox GL](https://www.mapbox.com) for the map and geocoding
- OpenAI vision for species identification
- Tailwind CSS

Stripe and an optional Telegram bot cover payments and a companion client. They are not required to run the social and map flows locally.

## Local setup

Requirements: Node.js 20+, a PostgreSQL database (Supabase works), and a Mapbox public token.

```bash
npm install
```

Create `.env.local` in the project root. `.env*` is gitignored. Use your own values. Do not commit this file.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
NEXT_PUBLIC_MAPBOX_TOKEN="your_public_mapbox_token"
OPENAI_API_KEY="your_openai_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="a_long_random_string"
```

`DATABASE_URL` should be the pooled connection (port 6543 on Supabase). `DIRECT_URL` is the direct connection Prisma uses for schema changes. The app adds `pgbouncer=true` and `connection_limit=1` when the pooled URL is on port 6543.

Optional, for payments or the Telegram bot:

```bash
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_BOT_USERNAME=""
```

Push the schema and seed sample anglers:

```bash
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

SQL files in `prisma/migrations/` are additive scripts (columns, row-level security). Apply them in the Supabase SQL editor when the database was created outside `db push`. The app reads and writes through Prisma, not the Supabase data API.

In the Mapbox dashboard, restrict the public token to your local and production URLs.

## Architecture

### App structure

Pages live in `app/`. Server Components load the first view (feed, profile, map saved locations). Interactive surfaces — the map, sheets, and the catch form — are Client Components. Mutations and client fetches go through Route Handlers in `app/api/`.

### Social data

Users, catches, follows, comments, reactions, and referrals are Prisma models. The feed query in `app/api/feed/_service.ts` loads recent public catches. Catches from the same angler and place within a few seconds are grouped into one card. If someone you follow comments on a post outside that set, the post is surfaced at the top of the Following-aware feed.

A referral stays pending until the invited angler publishes a first photo catch inside the expiry window. That completion is handled in the create-catch route.

### Map data

`components/map/hooks/useMapInitialization.ts` creates one Mapbox map and swaps styles without destroying it. `useMapCatches` asks `/api/catch/map` for the current bounds. Community mode waits until the map is zoomed in, then the route returns points inside that box.

Coordinates are exact for the catch owner and for PRO. Other viewers receive coordinates snapped to a coarse grid, and the client draws those as a heatmap. Place search uses the Mapbox Geocoding API. Live mode polls for new public catches in the viewport.

### Auth and storage

Sign-in is Supabase Auth (Google and email codes). The session is stored in HttpOnly cookies. `lib/auth.ts` resolves the cookie to an application user id. `SUPABASE_SERVICE_ROLE_KEY` is read only in server modules for Storage uploads and account deletion. It is never given a `NEXT_PUBLIC_` name.

Catch photos and avatars are uploaded through `/api/upload` and `/api/upload-supabase` into public Storage buckets. `/api/upload` checks image bytes against file signatures before the object is written.

### Species identification

The catch form posts the image to `/api/openai/identify`. The route checks the session, enforces a monthly free-tier cap in `lib/ai-gate.ts`, and calls the vision model with `OPENAI_API_KEY`. The key stays on the server. Usage is incremented only after a successful identification.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync `prisma/schema.prisma` to the database |
| `npx prisma db seed` | Load sample anglers and catches |
