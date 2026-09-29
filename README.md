# Fitness Dashboard

A simple, editable dashboard for tracking water intake, sleep, and workouts —
built around "The Progressive Full-Body System" (kettlebell + bodyweight +
skipping rope, 3 sessions/week).

- **Dashboard** — today's water/sleep quick-log, editable daily goals,
  progress charts (water & sleep last 14 days, push-up trend across recent
  workouts), and today's plan straight from your notes' weekly rotation
  (e.g. "Today (Wednesday) — Workout B", or a rest/mobility day).
- **Log a workout** — pick Workout A (Strength), Workout B (Athletic), or a
  Minimum Day, set the date and number of rounds, then log **each round
  separately** — round 1's actual reps don't have to match round 2's, and
  you can come back and edit either one independently at any time.
- **History** — browse every past workout, water, and sleep entry; click any
  workout to see its full round-by-round breakdown, edit any round, or
  delete the whole entry.

## Stack & why

- **Next.js 15 (App Router) + TypeScript** — one app, server-rendered pages
  (fast first paint, no client-side data-fetch waterfall) with API routes for
  mutations.
- **Prisma + Postgres** — a real database, not browser storage, so nothing
  is lost if you clear your browser. The same `DATABASE_URL` env var is
  used for local dev and for the deployed app on Vercel (see "Deploying to
  Vercel" below) — one free Neon Postgres database (via Vercel's Storage
  tab) covers both, no separate local database to install.
- **Recharts** — the progress charts.
- **Tailwind CSS** — styling, no component framework overhead.

No heavy client bundle, no polling — pages are ~100KB first load and API
calls are simple single-purpose routes. In local testing, warm page loads
were consistently under 50ms.

## Running it locally

This needs a Postgres database to point at — see "Deploying to Vercel"
below for the fastest free option (a Neon database from Vercel's Storage
tab works equally well for local dev; a local Postgres install works too).

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL with your Postgres connection string
npx prisma migrate dev      # creates the schema in that database
npm run dev                 # http://localhost:3000
```

Open the app, click **Start program today** on the dashboard to set your
Day 1, and start logging.

## Testing what was built

- `npm run build` — production build; verifies types and that every route
  compiles (already run once while building this — passes clean).
- Manual smoke test performed while building this, driven through a real
  browser (Playwright), against a real local Postgres instance: quick-added
  water and sleep from the dashboard, started a 2-round workout, saved each
  round independently, confirmed History and the workout detail page both
  reflected it immediately, then deleted the test entries — all against
  Postgres in production mode (`npm run build && npm run start`).
- There's no automated test suite yet (none was requested) — if you want
  regression coverage as this grows, the natural next step is a handful of
  route-handler tests against a throwaway Postgres database.

## Your data / backup

Everything lives in your Postgres database — nothing is stored in the repo
or in the browser, so it survives a fresh `git clone` or a cleared browser.
Back it up anytime with `pg_dump`:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

Neon (the database provider this README uses via Vercel) may also offer
built-in backups/point-in-time restore on its free tier — I haven't
verified current details, so check its dashboard rather than relying only
on the `pg_dump` above.

## Deploying to Vercel

Right now this runs locally — great for zero lag, but only reachable on the
machine it's running on. The app already speaks plain Postgres (via
`DATABASE_URL`), which is exactly what Vercel's own Storage tab provisions
(a Neon Postgres database), so there's no adapter code or separate
database CLI needed — just a connection string.

**1. Import the repo:** at [vercel.com/new](https://vercel.com/new), sign
in and import `Jbdpalle/WorkoutLog` from GitHub. It auto-detects Next.js —
don't click Deploy yet.

**2. Add a Postgres database:** in the project (before or right after the
first deploy), open the **Storage** tab → **Create Database** → **Postgres**
(Neon) → follow its prompts to create one and connect it to this project.
Vercel sets `DATABASE_URL` (and a couple of related vars) in the project's
environment variables for you automatically — you shouldn't need to type a
connection string in by hand.

**3. Apply the schema** to that new (empty) database. The simplest way:
copy the `DATABASE_URL` Vercel just created for you (Storage tab → your
database → `.env.local` tab has it) into your local `.env`, then run:

```bash
npx prisma migrate deploy
```

This applies both migrations already in `prisma/migrations/` in order —
straightforward with Postgres, unlike the SQLite/Turso path this README
used to describe.

**4. Deploy:** back in the Vercel project, click **Deploy** (or redeploy if
it already ran before the database existed). Open the resulting
`*.vercel.app` URL on your phone — "Add to Home Screen" for an app-like
icon.

Any future schema changes: run `npx prisma migrate dev` locally against
your dev database, then `npx prisma migrate deploy` against the same
`DATABASE_URL` Vercel uses (or let it run automatically — see the note
below).

**Optional:** to have migrations apply automatically on every deploy
instead of running step 3 by hand each time, you can change this repo's
`package.json` build script to run `prisma migrate deploy` before
`next build`, e.g. `"build": "prisma migrate deploy && next build"`. I
didn't make that change myself since it affects how every future deploy
behaves and seemed worth flagging rather than deciding for you — say the
word and I'll wire it in.

I didn't run steps 1–4 myself — they need your own Vercel account and the
database it would provision, which I don't have access to. Everything up
to "push the code" is done and verified (see below); the rest is a few
minutes of clicking through the Vercel dashboard. If you'd rather I ran the
deploy directly from here, see "Can I deploy this for you?" below.

**What I verified before pushing this:** built and ran the full app against
a real local Postgres database (not SQLite) in production mode, then drove
it through a real browser — quick-logged water and sleep from the
dashboard, started a 2-round workout, saved each round independently,
confirmed History and the workout detail page reflected it immediately,
deleted the test entries. I could not verify against your actual deployed
Neon/Vercel setup, since that needs accounts I don't have — worth a quick
click-through after your first deploy.

### Can I deploy this for you?

I can run the Vercel deploy directly from this session if you give me a
Vercel access token: create one at
[vercel.com/account/tokens](https://vercel.com/account/tokens), then add it
as an environment variable in this session's environment settings (the
cloud environment menu in the session's title bar → Edit) named
`VERCEL_TOKEN`. A new session picks it up — I'd use it non-interactively
with the Vercel CLI to link and deploy this project, and still need you to
create the Postgres database from Vercel's Storage tab first (that part
isn't scriptable from a token alone). Otherwise, the four steps above are
exactly what I'd run.

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
3. The **weekly A/B/rest schedule** (Mon A, Tue rest, Wed B, Thu rest, Fri A,
   Sat mobility, Sun rest — alternating A/B every week) is a separate,
   calendar-based rhythm from the 70-day phase cycle above. "Week 1" is
   always the calendar week (Mon–Sun) you hit **Start program today** in, so
   the alternation is anchored to your actual start date, not just any
   Monday. Verified against your notes' own Week 1 / Week 2 example for two
   full weeks before pushing this.

## A bug I found and fixed while building the rounds feature

The Dashboard and History pages were being **statically prerendered at
build time** (a Next.js default when a page has no dynamic APIs) instead of
rendering fresh on every request. In production mode, that meant both pages
would keep showing whatever the database looked like at the moment you ran
`npm run build` — not your actual logged data. I caught this while
smoke-testing the round-saving flow (a saved workout wasn't showing up on
History) and fixed it by adding `export const dynamic = "force-dynamic"` to
`app/page.tsx` and `app/history/page.tsx`, then re-verified both pages
reflect live writes immediately. Worth knowing in case you add other pages
later that read from the database — they need the same line, or Next.js
will silently freeze them at build time.

## Known low-risk dependency note

`npm audit` flags one remaining advisory: Next.js 15.5.26 (the latest
patched release as of this build) still bundles its own internal `postcss`
at a version with disclosed CSS-parsing edge cases. That's a build-tool
dependency inside Next's own toolchain, not something reachable by a user of
this app, and it'll clear on Next's next patch release. Everything else
(including the earlier critical Next.js Image Optimization RCE affecting the
whole 14.x line) is fixed by running on 15.5.26.
