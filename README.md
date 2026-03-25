# Sudha Website (Next.js + Convex + Simple Admin Auth)

This project is a Next.js app with:

- Public pages (`/`, `/blog`, `/blog/[id]`)
- Admin panel (`/admin`) protected by username/password login
- Convex persistence for posts, comments, and newsletter subscribers
- An in-repo Expo mobile admin scaffold at `apps/admin-mobile`

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill values:

- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT` (needed by Convex CLI)
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` (for comment notification emails)
- `COMMENT_NOTIFICATION_TO`
- `COMMENT_NOTIFICATION_FROM`

## 3. Set up Convex deployment

Run Convex setup in an interactive terminal:

```bash
npx convex dev
```

This command links the project, deploys functions from `convex/`, and keeps code synced while developing.

## 4. Run Next.js app

```bash
npm run dev
```

Open http://localhost:3000

## Mobile admin app

The repo also contains an Expo app shell for a phone-first admin experience:

```bash
npm run mobile:install
npm run mobile:start
```

The mobile app lives in `apps/admin-mobile` and is scaffolded for Expo Router with 4 tabs:

- Home
- Posts
- Comments
- Profile

Before running the mobile app, create `apps/admin-mobile/.env` from `apps/admin-mobile/.env.example` and set:

- `EXPO_PUBLIC_API_BASE_URL`
  example: `https://sudhamayam.vercel.app`

For Android APK builds with EAS, run commands from `apps/admin-mobile` after installing the Expo/EAS tooling and signing in.

## 5. Deploy on Vercel

Set all env vars in Vercel project settings:

- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `COMMENT_NOTIFICATION_TO`
- `COMMENT_NOTIFICATION_FROM`

## Notes

- Existing sample posts/comments are seeded automatically to Convex on first read.
- Admin create/edit now writes persistent data.
- Blog comments and newsletter subscription now persist in Convex.
