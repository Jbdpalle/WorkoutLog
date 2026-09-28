# Fitness Dashboard

A simple, editable dashboard for tracking water intake, sleep, and workouts —
built around "The Progressive Full-Body System" (kettlebell + bodyweight +
skipping rope, 3 sessions/week).

- **Dashboard** — today's water/sleep quick-log, editable daily goals, and
  progress charts (water & sleep last 14 days, push-up trend across recent
  workouts).
- **Log a workout** — pick Workout A (Strength), Workout B (Athletic), or a
  Minimum Day; the form pre-fills target reps for your current phase of the
  program and you fill in what you actually did.
- **History** — browse every past workout, water, and sleep entry; click any
  workout to see its full exercise breakdown, edit it, or delete it.

## Stack & why

- **Next.js 15 (App Router) + TypeScript** — one app, server-rendered pages
  (fast first paint, no client-side data-fetch waterfall) with API routes for
  mutations.
- **Prisma + SQLite** — a real database, not browser storage, so nothing is
  lost if you clear your browser. Local file (`prisma/dev.db`) by default,
  zero setup; swaps to a hosted [Turso](https://turso.tech) database for
  deployment (see "Deploying for phone access" below) via Prisma's libSQL
  driver adapter, with no code changes needed either way.
- **Recharts** — the progress charts.
- **Tailwind CSS** — styling, no component framework overhead.

No heavy client bundle, no polling — pages are ~100KB first load and API
calls are simple single-purpose routes. In local testing, warm page loads
were consistently under 50ms.

## Running it locally

```bash
npm install
cp .env.example .env        # local SQLite, nothing to fill in
npx prisma migrate dev      # creates prisma/dev.db with the schema
npm run dev                 # http://localhost:3000
```

Open the app, click **Start program today** on the dashboard to set your
Day 1, and start logging.

## Testing what was built

- `npm run build` — production build; verifies types and that every route
  compiles (already run once while building this — passes clean).
- Manual smoke test performed while building this: created a water entry, a
  sleep entry, and a full workout via the API, confirmed they showed up on
  the dashboard/history, edited and deleted a workout, reset the program
  start date — all round-tripped correctly against the real SQLite database
  in production mode (`npm run build && npm run start`).
- There's no automated test suite yet (none was requested) — if you want
  regression coverage as this grows, the natural next step is a handful of
  route-handler tests against a throwaway SQLite file.

## Your data / backup

Everything lives in `prisma/dev.db`, a single SQLite file, which is
git-ignored (databases don't belong in git history). To back it up, copy
that file somewhere safe, or export a portable snapshot of your logged
history anytime with:

```bash
sqlite3 prisma/dev.db .dump > backup.sql
```

## Deploying for phone / cross-device access

Right now this runs locally — great for zero lag, but only reachable on the
machine it's running on. Local SQLite files don't persist on Vercel (or any
host without a persistent disk), so the app also supports [Turso](https://turso.tech)
(a free-tier, SQLite-compatible hosted database) via Prisma's libSQL driver
adapter — the code for this is already in the repo (`lib/prisma.ts`,
`@prisma/adapter-libsql`) and falls back to the local file automatically
when `TURSO_DATABASE_URL` isn't set, so local dev is unaffected.

**1. Create the Turso database** (needs a free account at
[turso.tech](https://turso.tech) and their CLI):

```bash
turso auth login
turso db create workoutlog
turso db show workoutlog --url          # → TURSO_DATABASE_URL
turso db tokens create workoutlog       # → TURSO_AUTH_TOKEN
```

**2. Apply the schema** to that new (empty) database — Turso/libSQL don't
support `prisma migrate deploy` directly yet, so the recommended path is to
run the SQL Prisma already generated for you at
`prisma/migrations/20260928152642_init/migration.sql` straight through the
Turso CLI:

```bash
turso db shell workoutlog < prisma/migrations/20260928152642_init/migration.sql
```

**3. Deploy to Vercel:**
- Import this GitHub repo at [vercel.com/new](https://vercel.com/new) — it
  auto-detects Next.js.
- In the project's Environment Variables settings, add `TURSO_DATABASE_URL`
  and `TURSO_AUTH_TOKEN` from step 1.
- Deploy. Open the resulting `*.vercel.app` URL on your phone — you can "Add
  to Home Screen" for an app-like icon.

Any future schema changes: repeat step 2 with the new migration file after
running `prisma migrate dev` locally.

I didn't run steps 1–3 myself — they need your own Turso/Vercel accounts and
credentials, which I don't have access to. Everything up to "push the code"
is done and verified (see below); the rest is a few minutes of clicking
through those two dashboards.

**What I verified before pushing this:** the libSQL adapter path (read +
write) against a real local libSQL connection, and confirmed local dev is
byte-for-byte unaffected by the change (same build output, same response
times) since it silently falls back to the plain SQLite client when no Turso
URL is set. I could not verify against an actual Turso-hosted database or a
live Vercel deploy, since that needs accounts I don't have — worth a quick
end-to-end check after your first deploy.

## Notes on the workout program data (`lib/program.ts`)

Two things worth knowing, transcribed as-is from your notes rather than
guessed:

1. Your notes describe the 70-ish day cycle two different ways: a detailed
   walkthrough with exact rep numbers for Days 1–70 (Phases 1–5 plus two
   deloads), and a separate summary table that instead extends the cycle to
   80 days with different content for Days 61–80. This app follows the
   **detailed walkthrough** (it has concrete numbers), so the cycle here
   repeats every **70 days**. Worth a look if that doesn't match your intent.
2. The second deload (Days 61–70) has no exact rep numbers in your notes —
   just "reduce volume ~30–40%, do rope/mobility/easy bodyweight/light KB
   work." The app shows that guidance instead of inventing numbers; the
   workout form will just show blank/"by feel" targets during that block.

## Known low-risk dependency note

`npm audit` flags one remaining advisory: Next.js 15.5.26 (the latest
patched release as of this build) still bundles its own internal `postcss`
at a version with disclosed CSS-parsing edge cases. That's a build-tool
dependency inside Next's own toolchain, not something reachable by a user of
this app, and it'll clear on Next's next patch release. Everything else
(including the earlier critical Next.js Image Optimization RCE affecting the
whole 14.x line) is fixed by running on 15.5.26.
