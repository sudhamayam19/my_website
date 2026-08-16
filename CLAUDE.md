# Sudha Devarakonda — personal site

Next.js 15 (App Router) + Convex + Tailwind, deployed on Vercel.
Site: https://sudhamayam.vercel.app · Owner: Sudha Devarakonda (RJ, translator, podcaster).
Maintained by her son (Siddu) — he runs the commands; treat him as the operator.

---

## ⚠️ Read this before touching Convex

**Production deployment: `wonderful-caiman-362`**

1. **Convex does NOT deploy automatically.** `npm run build` is only `next build`.
   After ANY change to `convex/` (especially `schema.ts`), someone must run:
   ```
   npx convex deploy
   ```
   Skipping this is the #1 cause of bugs here — see "Server Error" below.

2. **`convex export` / `import` / `deploy` default to the DEV deployment.**
   Always pass `--prod` when you mean production. Forgetting it silently targets
   the wrong database.

3. **NEVER put `convex deploy --cmd 'next build'` in the build script.**
   It overrides `NEXT_PUBLIC_CONVEX_URL` at build time, repointing the live site
   at whatever deployment the deploy key targets. This happened on 2026-08-06:
   the key pointed at a dev deployment and the whole site appeared to lose its
   posts, podcasts and view counts. Nothing was deleted — it was reading the
   wrong database. `CONVEX_DEPLOY_KEY` is deliberately NOT set in Vercel.

---

## Common failure: `[Request ID: ...] Server Error`

This generic error almost always means **Convex rejected an unknown argument**.
Convex validators are strict — passing a field not declared in a mutation's
`args` throws.

Two real cases:
- Added `imageUrl` to a mutation but didn't run `npx convex deploy` → every save failed.
- The Better Us editor spread Convex's internal `_id` into the form and POSTed it.
  Fix: whitelist fields server-side before calling the mutation
  (see `src/app/api/admin/changemakers/route.ts`).

When you see this error, check both: (a) is Convex deployed? (b) is the API
route sending exactly the declared args?

---

## Backups

```
npm run db:backup     # full prod snapshot (data + files) → backups/
npm run db:restore backups/<file>.zip
```
`backups/*.zip` is git-ignored (contains reader comments / personal data).
Take one before any schema change or bulk edit.

---

## Git / deployment

- Push to `main` → Vercel auto-deploys (~2 min).
- Convex must be deployed separately (see above).
- Some sandboxed sessions cannot push (they authenticate as a different GitHub
  account and are proxy-gated). If pushing fails, hand the user the commands or
  a `git format-patch` file and let them push from their machine.

---

## Layout

```
src/app/            routes (blog, podcasts, discussions, books, gallery, media, admin)
src/components/     UI; admin/ holds the editors
src/lib/            content-store.ts (main Convex data layer), discussions.ts
convex/             schema.ts, content.ts (most functions), discussions.ts
public/gallery/     photo-1.jpg … photo-N.jpg — referenced explicitly in
                    src/app/gallery/page.tsx, so ADD NEW FILES TO THAT LIST
```

---

## Features worth knowing

- **Discussions** (`/discussions`) — host-led, NOT an open forum. Sudha posts a
  prompt ("the line to discuss") plus guidelines from `/admin/discussions`;
  readers may only reply. She explicitly did not want readers starting topics.
  Her replies get a "Sudha" badge (detected via `isAdminRequest`).
- **The Better Us** (`/admin/changemakers`) — weekly featured changemaker.
- **Books** (`/books`) — her Telugu translation of *Kriya Yoga Darsanam*,
  with a CSS-3D rotating cover.
- **Daily Dose** — quote banner on the homepage, rotates every 4 days.
- **Tillu** — in-house AI assistant in the admin area (Gemini-backed).

---

## Working style

- She is not technical. Admin UI must be simple and forgiving.
- Verify claims before making them — don't say something is fixed or synced
  unless it's confirmed. (A Spotify→website auto-sync was once implied but does
  not exist; episodes are added manually.)
- Podcast: "Telugu Lessa" — ~17k plays, 195 followers. The site gets far less
  traffic than the podcast, so driving listeners to the site matters.
- AdSense: the biggest blocker is the `.vercel.app` subdomain; a custom domain
  is the highest-impact fix. Comment counts are irrelevant to approval.
