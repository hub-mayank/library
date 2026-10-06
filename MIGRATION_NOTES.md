# Migration Notes — Library Management & Lending App

> Audit of the legacy Express + EJS codebase in `/legacy`.  
> Read-only reference — do not modify anything under `/legacy`.

---

## a. Routes and Pages

| Method | Path | Auth guard | Role | What it does |
|--------|------|------------|------|--------------|
| GET | `/` | none | public | Landing page with library rules; redirects logged-in librarian → `/dashboard`, member → `/my-books` |
| GET | `/register` | `isGuest` | public only | Show registration form |
| POST | `/register` | `isGuest` | public only | Create member account, hash password, set session, redirect `/books` |
| GET | `/login` | `isGuest` | public only | Show login form |
| POST | `/login` | `isGuest` | public only | Verify credentials, set session, redirect `/` |
| POST | `/logout` | none | any logged-in | Destroy session, redirect `/login` |
| GET | `/books` | `isLoggedIn` | member + librarian | Catalogue with search (title/author regex) and category filter; members see their active-book count |
| GET | `/books/new` | `isLibrarian` | librarian | Show add-book form |
| POST | `/books` | `isLibrarian` | librarian | Create book; validates ISBN (10/13 digits), category enum, uniqueness, copies ≥ 1; `availableCopies` initialised to `totalCopies` |
| GET | `/books/:id/edit` | `isLibrarian` | librarian | Show edit-book form, pre-populated |
| POST | `/books/:id/edit` | `isLibrarian` | librarian | Update book; prevents reducing `totalCopies` below currently issued count |
| POST | `/books/:id/delete` | `isLibrarian` | librarian | Delete book; blocked if any pending/issued issues or unpaid fines exist |
| POST | `/books/:id/request` | `isMember` | member | Request a book; checks duplicate, availability, 3-book cap |
| GET | `/my-books` | `isMember` | member | Member's current (pending/issued) and history (returned/rejected) with unpaid-fine total |
| GET | `/issues` | `isLibrarian` | librarian | Tabbed issue manager: pending / issued / overdue / fines / returned / rejected, with counts |
| POST | `/issues/:id/approve` | `isLibrarian` | librarian | Approve pending request; atomically decrements `availableCopies`; sets `issueDate = today`, `dueDate = today + 14` |
| POST | `/issues/:id/reject` | `isLibrarian` | librarian | Reject pending request; status → `rejected` |
| POST | `/issues/:id/return` | `isLibrarian` | librarian | Mark book returned; calculates fine = `daysLate × 5`; increments `availableCopies` |
| POST | `/issues/:id/pay` | `isLibrarian` | librarian | Mark fine as paid (`finePaid = true`) |
| GET | `/dashboard` | `isLibrarian` | librarian | Summary stats, top-5 overdue, top-5 pending requests, top-5 most borrowed books, overdue fine total, unpaid fine total |

> **404 / 500**: Catch-all handler renders `views/error.ejs`; `CastError` (bad MongoDB ObjectId) → 404.

---

## b. Data Model

### `users` collection — `models/User.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `_id` | ObjectId | auto |
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercase, trimmed |
| `password` | String | required (bcrypt hash, cost 10) |
| `role` | String | enum `["member","librarian"]`, default `"member"` |
| `createdAt` | Date | auto (timestamps) |
| `updatedAt` | Date | auto (timestamps) |

**Notes:**
- No self-promotion path; the `role` field is never taken from the registration form (`routes/auth.js:43`). The only way to have a `librarian` account is via the seed script or direct DB edit.
- No email-verification step.

---

### `books` collection — `models/Book.js`

| Field | Type | Constraints |
|-------|------|-------------|
| `_id` | ObjectId | auto |
| `title` | String | required, trimmed |
| `author` | String | required, trimmed |
| `isbn` | String | required, unique, trimmed, stored without dashes/spaces, uppercased |
| `category` | String | enum `["Fiction","Science","Technology","History","Biography","Self Help","Children"]` |
| `totalCopies` | Number | required, min 1 |
| `availableCopies` | Number | required, min 0 |
| `createdAt` | Date | auto |
| `updatedAt` | Date | auto |

**Relationships:**
- Referenced by `issues.book` (ObjectId → Book)

**Copy accounting:**
- `availableCopies` is a denormalised counter, not derived on-the-fly.
- Set to `totalCopies` on creation.
- Decremented atomically on approve; incremented on return.
- Edit route recomputes: `availableCopies = newTotalCopies − issuedCopies` (where `issuedCopies = old totalCopies − old availableCopies`).

---

### `issues` collection — `models/Issue.js`

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `_id` | ObjectId | auto |
| `book` | ObjectId | ref `Book`, required, indexed |
| `member` | ObjectId | ref `User`, required, indexed |
| `status` | String | enum `["pending","issued","returned","rejected"]`, default `"pending"` |
| `requestDate` | Date | default `Date.now` |
| `issueDate` | Date | set on approve |
| `dueDate` | Date | set on approve (`issueDate + 14 days`) |
| `returnDate` | Date | set on return |
| `fine` | Number | default 0; set permanently on return (`daysLate × 5`) |
| `finePaid` | Boolean | default false |

**Instance methods:**
- `daysLate()` — whole days past due at return time (or now if still issued); 0 if not overdue.
- `daysLeft()` — days remaining until due (can be negative).
- `isOverdue()` — `status === "issued" && daysLate() > 0`.
- `currentFine()` — live fine if issued (running clock); stored fine if returned; 0 for pending/rejected.

**Static helpers:**
- `Issue.rules` — `{ maxBooks: 3, loanDays: 14, finePerDay: 5 }` (source of truth in the legacy app).
- `Issue.overdueFilter()` — Mongo filter: `{ status: "issued", dueDate: { $lt: startOfDay(now) } }`.

---

## c. Business Rules

| # | Rule | Value | File | Line(s) |
|---|------|-------|------|---------|
| 1 | Max active books per member (pending + issued combined) | 3 | `legacy/models/Issue.js` | 5 |
| 2 | Loan duration | 14 days | `legacy/models/Issue.js` | 6 |
| 3 | Fine per overdue day | ₹5 | `legacy/models/Issue.js` | 7 |
| 4 | Fine calculation | `daysLate × finePerDay`, whole days only, counted from `startOfDay(dueDate)` to `startOfDay(returnDate or now)` | `legacy/models/Issue.js` | 31–38 |
| 5 | Duplicate-request check | A member cannot have two active (pending or issued) records for the same book | `legacy/routes/issues.js` | 19–24 |
| 6 | Availability check at request time | Request blocked if `availableCopies === 0` | `legacy/routes/issues.js` | 25–26 |
| 7 | Availability check at approve time | Atomic `findOneAndUpdate` with `availableCopies: { $gt: 0 }`; fails gracefully if race-condition depletes last copy | `legacy/routes/issues.js` | 101–108 |
| 8 | Loan cap enforced at request | `active.length >= maxBooks` blocks new request | `legacy/routes/issues.js` | 27–28 |
| 9 | ISBN format | Must match `/^(\d{9}[\dX]|\d{13})$/` (10 or 13 digits, last digit of ISBN-10 may be X) | `legacy/routes/books.js` | 27–29 |
| 10 | ISBN uniqueness | Unique across all books (excluding self on edit) | `legacy/routes/books.js` | 36–39 |
| 11 | Cannot reduce `totalCopies` below currently issued count | Checked on edit | `legacy/routes/books.js` | 139–141 |
| 12 | Book deletion blocked | If any pending/issued issues, or any returned issue with unpaid fine > 0 | `legacy/routes/books.js` | 172–183 |
| 13 | Role assignment | All self-registered users are `member`; `role` is never taken from form | `legacy/routes/auth.js` | 43 |
| 14 | Password minimum length | 6 characters (client-side label + server-side check) | `legacy/routes/auth.js` | 28–30 |
| 15 | Email uniqueness on registration | Checked before account creation | `legacy/routes/auth.js` | 32–34 |
| 16 | Generic login error | Same error message for "user not found" and "wrong password" to prevent email enumeration | `legacy/routes/auth.js` | 60–62 |

---

## d. Request Flow

```
Member                       Server                           DB
  |                             |                              |
  |-- POST /books/:id/request -->|                              |
  |                             |-- Find Issue where           |
  |                             |   member=me, status in       |
  |                             |   [pending,issued]  -------->|
  |                             |<-- active[]  ----------------|
  |                             |                              |
  |                        [CHECKS]                            |
  |                   alreadyHas this book?  → flash error, redirect back
  |                   availableCopies === 0? → flash error, redirect back
  |                   active.length >= 3?    → flash error, redirect back
  |                             |                              |
  |                             |-- Issue.create({             |
  |                             |   status:"pending"}) ------->|
  |                             |                              |
  |<-- redirect /my-books ------|                              |
  |                             |                              |

Librarian                    Server                           DB
  |                             |                              |
  |-- POST /issues/:id/approve -->|                             |
  |                             |-- Issue.findById ----------->|
  |                             |<-- issue (status=pending) ---|
  |                             |                              |
  |                             |-- Book.findOneAndUpdate      |
  |                             |   availableCopies > 0,       |
  |                             |   $inc:-1  ---------------->|
  |                             |<-- book (or null if 0 left)--|
  |                             |                              |
  |                        [if null] → flash "no copies", redirect back
  |                             |                              |
  |                             |-- issue.status = "issued"    |
  |                             |   issueDate = today          |
  |                             |   dueDate = today + 14       |
  |                             |   issue.save() ------------>|
  |<-- redirect back -----------|                              |
  |                             |                              |
  |-- POST /issues/:id/reject -->|                             |
  |                             |-- issue.status = "rejected"  |
  |                             |   issue.save() ------------>|
  |<-- redirect back -----------|                              |
  |                             |                              |
  |-- POST /issues/:id/return -->|                             |
  |                             |-- issue.status = "returned"  |
  |                             |   returnDate = today         |
  |                             |   fine = daysLate() × 5     |
  |                             |   issue.save() ------------>|
  |                             |-- Book.updateOne             |
  |                             |   $inc availableCopies:+1 ->|
  |<-- redirect back -----------|                              |
  |                             |                              |
  |-- POST /issues/:id/pay ----->|  (if fine > 0 && !finePaid)|
  |                             |-- issue.finePaid = true      |
  |                             |   issue.save() ------------>|
  |<-- redirect back -----------|                              |
```

### Status state machine

```
                  ┌──────────┐
        request   │          │  reject
   ─────────────► │ pending  │ ──────────► rejected  (terminal)
                  │          │
                  └────┬─────┘
                       │ approve
                       ▼
                  ┌──────────┐
                  │  issued  │ ──────────► returned  (terminal, fine may apply)
                  └──────────┘  return
```

- `pending` → `issued` (approve) or `rejected` (reject)
- `issued` → `returned` (return)
- No cancellation path exists — a member cannot cancel their own pending request.
- No re-issue path — a returned record stays returned permanently.
- No "cancelled" status in the schema.

---

## e. Gaps and Bugs

| # | Description | Type | Location |
|---|-------------|------|----------|
| G1 | **No member self-cancellation.** A member can see their pending requests on `/my-books` but has no button to cancel one. Only the librarian can reject it. The UI shows no cancel action for members. | Missing feature | `views/issues/my-books.ejs` — no cancel form |
| G2 | **Loan-limit check uses request time, not approve time.** If a member already has 3 active items when they request a 4th, that is blocked. But if a librarian approves 3 requests before rejecting, the limit check is only at request time; the approve path does **not** re-check `active.length >= maxBooks`. A librarian could technically approve a 4th request for a member if the member hit the limit later. | Bug / gap | `routes/issues.js:92-122` (approve has no count check) |
| G3 | **`availableCopies` is a denormalised counter with no reconciliation.** If the server crashes between the `findOneAndUpdate` (decrement) and `issue.save()` during approve, or between `issue.save()` and `Book.updateOne` during return, the counter drifts. No periodic reconciliation job exists. | Bug / data integrity | `routes/issues.js:101-118`, `139-160` |
| G4 | **Fine is a running-clock display until return, then frozen.** `currentFine()` for an issued/overdue book computes live from `now`. Once returned, `fine` is frozen at return-day. There is no server-side job to freeze or record fines for books still outstanding (e.g. for reporting). | Design note | `models/Issue.js:48-56` |
| G5 | **Open Library cover image is UI-only.** Covers are fetched client-side via `https://covers.openlibrary.org/b/isbn/<ISBN>-L.jpg`. No server-side validation that a cover exists. The `onerror` handler hides a broken `<img>` gracefully, but there is no server-enforced relationship with Open Library. | Design note / external dependency | `views/books/index.ejs:61-62` |
| G6 | **Password minimum-length (6) enforced server-side but not in HTML.** The `<input type="password">` in `views/register.ejs` has no `minlength` attribute. The check exists server-side (`routes/auth.js:28`) but the browser offers no native hint. | Minor UX gap | `views/register.ejs` |
| G7 | **Session cookie is not marked `httpOnly` or `secure`.** `express-session` defaults `httpOnly: true` but `secure` is not set, so the cookie will be sent over plain HTTP in development. No `sameSite` attribute is set either. | Security gap | `server.js:36-42` |
| G8 | **No CSRF protection.** All state-changing POST routes (approve, reject, return, pay, delete) rely solely on session auth. There is no CSRF token. | Security gap | All POST routes |
| G9 | **`connect-mongo` is imported incorrectly.** `const { MongoStore } = require("connect-mongo")` uses named destructuring, but `connect-mongo` v4+ exports the class as the default export. The correct form is `const MongoStore = require("connect-mongo")`. This likely throws at startup. | Bug | `server.js:6` |
| G10 | **`isMember` middleware also blocks librarians from their own redirected pages.** If a librarian visits `/my-books` or tries to request a book, they get "Only members can borrow books" and are redirected to `/`. This is intentional by design but undocumented. Librarians see no borrow UI at all. | Design decision (undocumented) | `middleware/auth.js:26-29` |
| G11 | **No pagination on any list.** The catalogue (`/books`), issue tabs (`/issues`), and member history (`/my-books`) fetch all matching documents. This could be slow with a large dataset. | Scalability gap | `routes/books.js:60`, `routes/issues.js:84`, `routes/issues.js:43` |
| G12 | **`daysLate()` uses `Math.round`, which can produce unexpected results at exactly half a day.** A book returned 12 hours after midnight on the due date rounds to 1 day late instead of 0. `Math.floor` would be safer. | Minor bug / rounding | `models/Issue.js:36` |

---

## f. Environment Variables and External Services

### Environment variables (`legacy/.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas (or any Mongo) connection string |
| `SESSION_SECRET` | Yes | Any long random string for `express-session` |
| `PORT` | No | HTTP port (default `3000`) |

### External services

| Service | How used | Where |
|---------|----------|-------|
| **MongoDB Atlas** | Primary database | `server.js:23`, `seed.js:89` |
| **Open Library Covers API** | Book cover images fetched client-side: `https://covers.openlibrary.org/b/isbn/<ISBN>-L.jpg?default=false` | `views/books/index.ejs:61-62` |

No API keys are required for Open Library covers (public CDN).

---

## Open Questions

1. **`connect-mongo` import** (see G9): Was this actually working? `connect-mongo` v4+ exports a default, not a named export. If the app was running, this may mean an older version of `connect-mongo` was installed that did support named exports, or the sessions simply failed silently.

2. **Librarian account creation**: The only way to create a librarian is via `seed.js` or a direct DB write. Was there ever an intended admin-invite or first-run setup screen?

3. **Fine payment workflow**: Fine is marked paid by the librarian manually (`/issues/:id/pay`). Is there any intended integration with a payment gateway, or is this assumed to be cash collected in person?

4. **Copy counting on edit**: When `totalCopies` is increased on edit, `availableCopies` increases by the same delta. But pending requests are not automatically approved. Is that intentional — i.e., adding copies does not trigger approval of queued pending requests?

5. **`daysLate` rounding** (see G12): Is `Math.round` the intended behaviour, or was `Math.floor` meant (no fine unless a full day late)?

6. **Overdue tab vs. Issued tab**: Overdue issues also appear on the "Issued" tab (they are still status `issued`). Only the "Overdue" tab applies `overdueFilter`. Was the intention to keep them separate, or should the UI de-duplicate?
