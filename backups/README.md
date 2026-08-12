# Database Backups

Snapshots of the **production** Convex database (`wonderful-caiman-362`).

The `.zip` files here are **git-ignored** — they contain reader comments and
other personal data, so they must never be committed.

## Take a backup

```bash
npm run db:backup
```

Creates `backups/convex-prod-YYYY-MM-DD_HH-MM-SS.zip` with every table **and**
all uploaded images. Keeps the newest 10.

Do this before: any schema change, bulk edits/deletions, or changing Vercel /
Convex environment variables.

## Restore

⚠️ **Overwrites production. Take a fresh backup first.**

```bash
npm run db:restore backups/convex-prod-2026-08-06_10-44-00.zip
```

One table only:

```bash
npx convex import --prod --replace --table posts backups/<file>.zip
```

Test a snapshot safely by importing into **dev** instead (drop `--prod`):

```bash
npx convex import --replace-all backups/<file>.zip
```

## Important

`convex export` and `convex import` default to the **dev** deployment.
Always pass `--prod` for production — forgetting it is how you silently back up
(or overwrite) the wrong database.
