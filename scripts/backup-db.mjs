#!/usr/bin/env node
/**
 * Backs up the PRODUCTION Convex database (data + uploaded files) to backups/.
 * Keeps the newest KEEP snapshots and deletes older ones.
 *
 *   npm run db:backup
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const DIR = "backups";
const KEEP = 10;

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);
const out = join(DIR, `convex-prod-${stamp}.zip`);

if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });

console.log(`📦 Backing up PRODUCTION Convex → ${out}`);
try {
  // --prod is essential: without it Convex exports the DEV deployment.
  execFileSync(
    "npx",
    ["convex", "export", "--prod", "--include-file-storage", "--path", out],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
} catch {
  console.error("\n❌ Backup failed. Are you logged in? Try: npx convex login");
  process.exit(1);
}

if (!existsSync(out)) {
  console.error("❌ Backup file was not created.");
  process.exit(1);
}

const sizeMb = (statSync(out).size / 1024 / 1024).toFixed(2);
console.log(`✅ Saved ${out} (${sizeMb} MB)`);

const snaps = readdirSync(DIR)
  .filter((f) => f.startsWith("convex-prod-") && f.endsWith(".zip"))
  .sort()
  .reverse();

for (const old of snaps.slice(KEEP)) {
  unlinkSync(join(DIR, old));
  console.log(`🗑️  Removed old backup ${old}`);
}
console.log(`📚 ${Math.min(snaps.length, KEEP)} backup(s) kept in ${DIR}/`);
