# Shalom — Hebrew for Nepali learners

- **Live:** [hebrew-lang.vercel.app](https://hebrew-lang.vercel.app)
- **Repo:** [github.com/aagatbhattaraixdezo-afk/Hebrew_Lang](https://github.com/aagatbhattaraixdezo-afk/Hebrew_Lang)

Full-stack web app (Duolingo × Udemy style) that teaches Hebrew to Nepali learners.
This is the vertical-slice scaffold — learner flow works end-to-end. Admin CRUD, the AI
generator, full PWA, and full i18n routing follow in subsequent build passes.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + custom warm/editorial theme + tri-script fonts (Rubik / Heebo / Mukta)
- Prisma + SQLite (dev) — swap `DATABASE_URL` to Postgres for prod
- Auth.js v5 (Credentials provider) + JWT sessions + role-based middleware
- Zod validation, bcryptjs hashes, framer-motion for feedback animations

## Run (local)
```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Deploy (Vercel + database)

Demo logins need a **seeded** Postgres DB and **non-empty** Vercel env vars (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`).

### Windows (path has spaces)

Prisma’s VS Code / CLI shims break under `E:\Restaurant Projects\...`. Use the npm scripts (they call `node` directly):

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
# or
.\scripts\db-setup.ps1
```

### Vercel env (Production)

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Postgres URI (Supabase pooler `:6543` or Prisma Postgres) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://hebrew-lang.vercel.app` |

Empty placeholders in the dashboard = login always fails. After setting values, redeploy.

### One-time DB setup

```bash
npm run db:deploy
npm run db:seed
```

With production secrets locally: `vercel env run -e production -- npm run db:deploy`

### Supabase

This app uses **Prisma + Auth.js**, not Supabase Auth. Link the project for CLI: `supabase link --project-ref <ref>`. Schema/data live in Postgres; ignore Supabase **Authentication → URL Configuration** for login.

## Demo accounts (password is `password123` for all)
- **Admin** — admin@demo.test
- **Learner** — aarati@demo.test (has partial progress + 2-day streak)
- **Learner** — binod@demo.test
- **Learner** — chandra@demo.test

## What's built
- Auth + role gating (`/admin/*` is ADMIN only)
- Dashboard (XP ring, streak flame, "continue learning" hero, enrolled-course cards)
- Course page (vertical learning path, locked / unlocked / completed states)
- Lesson page — Nepali-first body, optional `videoUrl`, MCQ runner with instant
  feedback, Nepali explanations, animated correct/incorrect reveal
- XP / streak / `LessonProgress` server action (idempotent, only awards XP first time)
- Admin shell + dashboard with live counts, stub pages for Courses/Students/AI

## What's next (planned)
- Admin full CRUD for courses → modules → lessons → MCQs → quizzes → flashcards
- Bulk student add (CSV) + enrollment toggles
- `/quizzes/[id]` and `/flashcards/[id]` (SM-2-lite) learner pages
- `/profile` with badges
- `/api/ai/generate` (Gemini default), Zod-validated draft pipeline at `/admin/generate`
- next-pwa service worker + offline cache
- next-intl (or compatible) full ne/en routing
