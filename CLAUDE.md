# Notion Fitness – Claude Code Guide

## What This Is
Full-stack fitness tracker PWA (React 19 + Hono/tRPC + MySQL).
Live URL: https://mdlmncn5yzs5o.kimi.place

## Stack
| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Radix UI / shadcn-ui |
| Routing | React Router 7 |
| State | tRPC + TanStack Query (no Redux) |
| Backend | Hono (Node.js), tRPC server |
| Database | MySQL via Drizzle ORM |
| Auth | JWT (jose) stored in localStorage |
| Charts | Recharts |
| Animations | Framer Motion |
| Mobile | Capacitor (iOS + Android) |

## Project Layout
```
app/
├── src/
│   ├── sections/       # One file per tab: Dashboard, WorkoutHub, WorkoutLogger,
│   │                   #   ExerciseLibrary, Routines, Analytics, History, Profile, AuthScreen
│   ├── hooks/          # useAuth.ts, useWorkoutStore.ts
│   ├── components/     # Navigation.tsx, ErrorBoundary.tsx, ProgramPreviewModal.tsx, ui/
│   ├── providers/      # trpc.tsx (TRPCProvider)
│   ├── types/          # index.ts – shared TypeScript types
│   ├── App.tsx         # Root router (tabs, auth gate, active session)
│   └── main.tsx        # Entry point
├── api/
│   ├── boot.ts         # Hono server entry
│   ├── router.ts       # tRPC app router
│   ├── routers/        # auth.ts, data.ts
│   ├── lib/            # defaults.ts (seed data), jwt.ts, env.ts
│   └── context.ts      # tRPC context (DB + user)
├── db/
│   ├── schema.ts       # Drizzle schema (users, exercises, sessions, routines…)
│   ├── relations.ts    # Drizzle relations
│   └── seed.ts         # Default exercises and programs
├── contracts/          # Shared tRPC types between frontend & backend
├── .env                # Secrets – DATABASE_URL, APP_SECRET, JWT_SECRET
├── drizzle.config.ts   # Drizzle Kit config
├── vite.config.ts      # Vite + Hono dev server
├── tailwind.config.js
└── package.json
```

## Common Commands
```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Build frontend + bundle API → dist/
npm run start      # Run production build (node dist/boot.js)
npm run check      # TypeScript type-check
npm run db:push    # Sync schema changes to MySQL (dev)
npm run db:migrate # Apply SQL migrations (production)
npm run db:generate # Generate migration SQL from schema changes
```

## Environment Variables (.env)
```
DATABASE_URL=mysql://user:pass@host:port/dbname
APP_SECRET=<random 32-char string used for JWT signing>
VITE_APP_ID=<app id if needed>
```
**The current DATABASE_URL points to Kimi's private Aliyun MySQL.**
To run locally or deploy elsewhere, provision a new MySQL database and update DATABASE_URL.
Recommended free options: Railway (mysql), PlanetScale, Aiven.

## How to Make Changes (Claude Code Workflow)
1. Edit source files in `src/` or `api/` directly
2. `npm run dev` to test locally (hot reload works)
3. `npm run build` to produce a production build in `dist/`
4. Deploy by pushing `dist/` + `api/` to the hosting provider

## Database Changes
- Edit `db/schema.ts` to add/modify tables
- Run `npm run db:push` to apply to dev database
- Run `npm run db:generate` then `npm run db:migrate` for production migrations

## Default Data / Seed
- All programs and default exercises live in `api/lib/defaults.ts`
- Add new programs/exercises there (they're seeded when a new user registers)
- HYROX Standard Race: 8 exercises (SkiErg, Sled Push, Sled Pull, Burpee Broad Jump, Rowing, Farmers Carry, Sandbag Lunges, Wall Balls)

## Key Design Patterns
- **Auth**: `useAuth` hook manages JWT token + user object in localStorage
- **Data**: `useWorkoutStore` aggregates all workout data via tRPC calls
- **Tab navigation**: `App.tsx` renders one section at a time based on `store.currentTab`
- **Program preview**: `ProgramPreviewModal` intercepts all program card clicks before starting
- **Active workout**: `WorkoutLogger` renders instead of normal tabs when `store.activeSession` is set

## Deployment (Current: Kimi)
The app is currently deployed via Kimi's cloud editor at mdlmncn5yzs5o.kimi.place.
To move to self-hosted, use Railway:
1. `railway login` → `railway init` → `railway up`
2. Provision MySQL: `railway add mysql`
3. Update DATABASE_URL in Railway environment variables
4. `npm run db:push` to create tables
