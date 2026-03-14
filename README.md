# Sudha Website (Next.js + Convex + Simple Admin Auth)

This project is a Next.js app with:

- Public pages (`/`, `/blog`, `/blog/[id]`)
- Admin panel (`/admin`) protected by username/password login
- Convex persistence for posts, comments, and newsletter subscribers

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

## 5. Deploy on Vercel

Set all env vars in Vercel project settings:

- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_CONVEX_URL`

## Notes

- Existing sample posts/comments are seeded automatically to Convex on first read.
- Admin create/edit now writes persistent data.
- Blog comments and newsletter subscription now persist in Convex.
