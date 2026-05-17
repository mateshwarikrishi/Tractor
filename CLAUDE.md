# Tractor — Project Guide

A full-stack business management app for customers, orders, payments, and users. Manually bootstrapped (create-t3-app failed on Windows TTY).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| API | tRPC v11 + React Query v5 |
| Auth | BetterAuth v1 (email + password) |
| Database | PostgreSQL via Prisma v6 |
| UI | Tailwind CSS v3, Radix UI, Shadcn components, Lucide icons |
| Forms | React Hook Form + Zod |
| Serialization | SuperJSON |
| Runtime | Node 24.15.0 (nvm) |

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # TypeScript check (run before committing)
npm run lint         # ESLint

npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema to DB (dev only, no migration file)
npm run db:migrate   # Create a tracked migration
npm run db:studio    # Open Prisma Studio GUI
```

## Environment

Copy `.env.example` to `.env` and set:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<random-secret-min-32-chars>
BETTER_AUTH_URL=http://localhost:3000
```

Validated at startup by `src/env.ts` (Zod). The app throws on boot if any required var is missing.

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...all]/      # BetterAuth HTTP handler (GET + POST)
│   │   └── trpc/[trpc]/        # tRPC HTTP handler
│   ├── login/                  # Login page (public)
│   ├── register/               # Register page (public)
│   ├── customers/              # Customers CRUD page (protected)
│   ├── orders/                 # Orders CRUD page (protected)
│   ├── payments/               # Payments CRUD page (protected)
│   ├── users/                  # Users CRUD page (protected)
│   ├── layout.tsx              # Root layout — conditionally shows NavBar
│   └── page.tsx                # Dashboard with stat cards
├── server/
│   ├── db.ts                   # Prisma singleton
│   └── api/
│       ├── trpc.ts             # Context (db + session) + publicProcedure + privateProcedure
│       ├── root.ts             # Root router (combines all sub-routers)
│       └── routers/            # customer, order, payment, user
├── trpc/
│   ├── server.ts               # Server-side hydration helpers
│   ├── react.tsx               # Client-side tRPC + React Query setup
│   └── query-client.ts         # React Query config (superjson, 30s stale)
├── lib/
│   ├── auth.ts                 # BetterAuth server instance (server-only)
│   ├── auth-client.ts          # BetterAuth client instance (browser)
│   └── utils.ts                # cn() — clsx + tailwind-merge
├── components/
│   ├── nav-bar.tsx             # Sidebar (desktop) + bottom bar (mobile) + sign-out
│   └── ui/                     # Shadcn primitives (button, input, sheet, etc.)
├── middleware.ts               # Redirects unauthenticated users to /login
└── env.ts                      # Env var validation
prisma/
└── schema.prisma               # DB schema
```

## Authentication

BetterAuth handles sessions via httpOnly cookies (`better-auth.session_token`).

**Server instance** (`src/lib/auth.ts`): used in tRPC context and root layout. Always `server-only`.

**Client instance** (`src/lib/auth-client.ts`): used in components.

```typescript
// Sign in (client component)
import { signIn } from "@/lib/auth-client";
const { error } = await signIn.email({ email, password });

// Sign up (client component)
import { signUp } from "@/lib/auth-client";
const { error } = await signUp.email({ name, email, password });

// Sign out
import { signOut } from "@/lib/auth-client";
await signOut();

// Read session in client component
import { useSession } from "@/lib/auth-client";
const { data: session } = useSession();

// Read session in Server Component
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const session = await auth.api.getSession({ headers: await headers() });
```

**Route protection**: `src/middleware.ts` checks for the session cookie and redirects to `/login` if absent. `/login`, `/register`, and `/api/auth/*` are always public.

## tRPC Patterns

All routers live in `src/server/api/routers/` and are combined in `src/server/api/root.ts`.

All procedures use `privateProcedure` — unauthenticated calls throw `UNAUTHORIZED`. Use `publicProcedure` only for explicitly public endpoints.

**Server-side prefetch (RSC):**
```typescript
// In a page.tsx (Server Component)
await api.customer.getAll.prefetch();
return <HydrateClient><ClientComponent /></HydrateClient>;
```

**Client-side query:**
```typescript
const { data } = api.customer.getAll.useQuery();
```

**Mutation:**
```typescript
const utils = api.useUtils();
const create = api.customer.create.useMutation({
  onSuccess: () => utils.customer.getAll.invalidate(),
});
```

**Input/output types:**
```typescript
import type { RouterInputs, RouterOutputs } from "~/trpc/react";
type CustomerCreateInput = RouterInputs["customer"]["create"];
```

## Database Schema

Models: **User**, **Session**, **Account**, **Verification** (BetterAuth-managed), **Customers**, **Orders**, **Payments**.

- BetterAuth models use String (cuid) IDs; app models use Int (autoincrement) IDs
- `User` Prisma model maps to `users` DB table via `@@map("users")` — required for BetterAuth compatibility
- `Customers` has many `Orders` and `Payments`
- `Orders` has many `Payments` (payment can also be customer-level, `orderId` optional)
- `Orders.type` enum: `TRIP | HOURLY`
- `User.role` enum: `ADMIN | USER`
- Monetary fields (`amount`, `rate`, `amountPaid`) use `Decimal` for precision

After any schema change: `npm run db:generate` then `npm run db:push`.

## UI Conventions

- Path alias: `@/*` → `src/*`
- Shadcn components in `src/components/ui/` — add new ones there
- `cn()` from `@/lib/utils` for conditional class merging
- Forms use `Sheet` (slide-out panel) pattern — see `customer-form.tsx` as reference
- Page-level `_components/` folder for co-located components
- Responsive: mobile-first; bottom nav on `md:hidden`, sidebar on `hidden md:flex`

## Adding a New Feature (typical pattern)

1. Add model to `prisma/schema.prisma` → `npm run db:generate && npm run db:push`
2. Create `src/server/api/routers/thing.ts` using `privateProcedure`
3. Register router in `src/server/api/root.ts`
4. Add page at `src/app/thing/page.tsx` (prefetch in RSC, render in client)
5. Add `_components/thing-form.tsx` and `thing-table.tsx`
6. Add nav link in `src/components/nav-bar.tsx`
