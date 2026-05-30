# Shalom — Hebrew for Nepali learners

Full-stack web app (Duolingo × Udemy style) that teaches Hebrew to Nepali learners.
This is the vertical-slice scaffold — learner flow works end-to-end. Admin CRUD, the AI
generator, full PWA, and full i18n routing follow in subsequent build passes.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + custom warm/editorial theme + tri-script fonts (Rubik / Heebo / Mukta)
- Prisma + SQLite (dev) — swap `DATABASE_URL` to Postgres for prod
- Auth.js v5 (Credentials provider) + JWT sessions + role-based middleware
- Zod validation, bcryptjs hashes, framer-motion for feedback animations

## Run
```bash
cp .env.example .env             # or use the committed .env for local dev
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

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
