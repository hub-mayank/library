# Library App

This is a rebuild of an earlier Express + EJS version, whose code is kept in `/legacy` during development.

## Pitch

## Features

- Member and librarian roles with protected Server Actions.
- Catalogue search, category filtering, and pagination.
- Member requests, cancellations, current loans, loan history, and fines.
- Librarian book management and issue workflow.
- Librarian dashboard with circulation, overdue, and fine summaries.
- Open Library book covers with a graceful missing-cover fallback.
- Postgres-backed rate limits for authentication and writes.
- Calendar-date loan rules, atomic copy counters, and RLS-backed reads.

## Live demo

## Screenshots

## Tech stack

## Architecture

## Decisions

### Business rules

- Calendar dates and timezone-aware "today" conversion live in [`src/lib/rules/dates.ts`](./src/lib/rules/dates.ts); `APP_TIME_ZONE` is `Asia/Kolkata` so date calculations follow the library's local day.
- Loan due dates use the configured loan duration in [`src/lib/rules/due-date.ts`](./src/lib/rules/due-date.ts).
- Fines use calendar-day lateness and the configured daily rate in [`src/lib/rules/fines.ts`](./src/lib/rules/fines.ts).
- ISBN normalization and validation live in [`src/lib/rules/isbn.ts`](./src/lib/rules/isbn.ts).
- Book-request limits and check ordering live in [`src/lib/rules/request.ts`](./src/lib/rules/request.ts).
- Loan lifecycle transitions live in [`src/lib/rules/loan-status.ts`](./src/lib/rules/loan-status.ts).
- Copy issuance, returns, and total edits live in [`src/lib/rules/copies.ts`](./src/lib/rules/copies.ts).
- Book-deletion guards live in [`src/lib/rules/book-deletion.ts`](./src/lib/rules/book-deletion.ts).

## Security decisions

- Reads use the signed-in user's Supabase SSR client so RLS applies.
- Writes use service-role wrappers only after every Server Action re-checks
  authentication, role, ownership, and input validation.
- Roles come from `profiles`, never user metadata or client input.
- Authentication uses `auth.getUser()`, not `getSession()`.
- Login errors are generic to avoid account enumeration.
- Redirect targets are restricted to same-site paths.
- Next.js Server Actions provide origin checks. Rate limits use the Postgres
  `rate_limits` table so they work across serverless instances. Login and
  registration fail closed if the limiter is unavailable; lending and
  librarian writes fail open so an infrastructure outage does not block
  ordinary library operations.
- All routes receive CSP, clickjacking, MIME-sniffing, referrer, permissions,
  and production transport-security headers. `script-src` still allows
  `'unsafe-inline'` because nonce-based CSP would force dynamic rendering;
  this is a known, documented limitation.
- The legacy gaps addressed here include member cancellation (G1), atomic copy
  counters (G3), password minimum length (G6), session/CSRF handling (G7/G8),
  and pagination (G11).

### Legacy gaps fixed

| Gap            | Status   |
| -------------- | -------- |
| G11 pagination | Complete |

## Run locally

## Database setup

1. Create a Supabase project and disable email confirmation for local demo use.
2. Copy the project URL, anon key, and service-role key to `.env.local` using
   [`.env.example`](./.env.example) as a guide.
3. Run
   [`supabase/migrations/0001_schema.sql`](./supabase/migrations/0001_schema.sql),
   [`supabase/migrations/0002_functions.sql`](./supabase/migrations/0002_functions.sql),
   [`supabase/migrations/0003_rls.sql`](./supabase/migrations/0003_rls.sql),
   and [`supabase/migrations/0004_rate_limit.sql`](./supabase/migrations/0004_rate_limit.sql)
   in that order in the Supabase SQL editor.
4. Run `npm run db:seed` to create labelled demo data.
5. Run `npm run db:verify` to check RLS, permissions, and atomic loan rules
   against the live project.

## Demo credentials

These are demo data credentials for local verification:

- Librarian: `librarian@demo.library.test` / `LibraryDemo123!`
- Member: `member@demo.library.test` / `LibraryDemo123!`
