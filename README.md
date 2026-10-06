# Library App

This is a rebuild of an earlier Express + EJS version, whose code is kept in `/legacy` during development.

## Pitch

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

## Run locally

## Demo credentials
