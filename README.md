# Library Management & Book Lending System

A web app for running a small library. Members can search the catalogue and request books. The librarian approves requests, takes books back, and collects fines for late returns.

**Live site:** _add the Render link here_

## Features

**Members**
- Register and login
- Search books by title or author, and filter by category
- Request a book (the librarian has to approve it)
- See current books, due dates, days left, fines and borrowing history

**Librarian**
- Add, edit and delete books (title, author, ISBN, category, total copies, available copies)
- Approve or reject requests
- Mark books as returned
- Mark fines as paid
- Dashboard with total books, issued books, overdue books, pending requests, fines and the most borrowed titles

## Borrowing rules

| Rule | Value |
|---|---|
| Books a member can have at once | 3 (pending requests count too) |
| Loan period | 14 days |
| Late fine | ₹5 for each day after the due date |

These numbers are in `models/Issue.js`, so they can be changed in one place.

A request cannot be made when a book has no copies left, when the member already has that book, or when the member is at the limit. Available copies go down by one when a request is approved and back up when the book is returned.

## How a request moves

```
pending  ->  issued  ->  returned
   |
   -> rejected
```

- **pending**: the member asked for the book
- **issued**: the librarian approved it, one copy is taken and the due date is set
- **returned**: the book came back, any fine is worked out and saved
- **rejected**: the librarian turned the request down

An issued book past its due date shows as **overdue**, and its fine keeps growing until it is returned.

## Tech stack

- Node.js and Express.js
- EJS for server side rendering
- MongoDB Atlas with Mongoose
- Sessions with express-session and connect-mongo
- bcryptjs for hashing passwords
- Plain CSS

## Folder structure

```
server.js          app setup, session, routes
seed.js            demo data
models/
  User.js          member or librarian
  Book.js          catalogue and the category list
  Issue.js         requests and loans, rules and fine logic
middleware/
  auth.js          isLoggedIn, isLibrarian, isMember, isGuest
routes/
  auth.js          home, register, login, logout
  books.js         catalogue, search, book add/edit/delete
  issues.js        request, approve, reject, return, pay fine, my books
  dashboard.js     librarian dashboard
views/             EJS pages
public/css/        style.css
```

## Running it locally

1. Install the packages

   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values

   ```
   MONGO_URI=your mongodb atlas connection string
   SESSION_SECRET=any long random text
   PORT=3000
   ```

   Make sure the connection string has a database name before the `?`, for example `...mongodb.net/library?retryWrites=true`.

3. Add the demo data (this clears the old library data first)

   ```
   npm run seed
   ```

4. Start the server

   ```
   npm start
   ```

   Then open http://localhost:3000

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Librarian | librarian@library.com | librarian123 |
| Member | aarav@demo.com | member123 |
| Member | priya@demo.com | member123 |
| Member | rohan@demo.com | member123 |

Aarav is already at the 3 book limit and has an overdue book, so he is a good account for showing the limit and fines.

New sign ups are always members. The librarian account only comes from the seed script.

## Routes

| Method | Path | Who | What it does |
|---|---|---|---|
| GET | `/` | everyone | home page, or sends a logged in user to their page |
| GET, POST | `/register` | guests | create a member account |
| GET, POST | `/login` | guests | login |
| POST | `/logout` | logged in | logout |
| GET | `/books` | logged in | catalogue with `?search=` and `?category=` |
| GET, POST | `/books/new`, `/books` | librarian | add a book |
| GET, POST | `/books/:id/edit` | librarian | edit a book |
| POST | `/books/:id/delete` | librarian | delete a book |
| POST | `/books/:id/request` | member | request a book |
| GET | `/my-books` | member | current books and history |
| GET | `/issues` | librarian | requests and loans, with `?tab=` |
| POST | `/issues/:id/approve` | librarian | approve a request |
| POST | `/issues/:id/reject` | librarian | reject a request |
| POST | `/issues/:id/return` | librarian | mark a book returned |
| POST | `/issues/:id/pay` | librarian | mark a fine paid |
| GET | `/dashboard` | librarian | dashboard |

## Deploying on Render

1. Push the code to GitHub. The `.env` file is not pushed.
2. On Render, create a **New Web Service** from the repository.
3. Build command `npm install`, start command `npm start`.
4. Add the environment variables `MONGO_URI` and `SESSION_SECRET`.
5. In MongoDB Atlas, go to Network Access and allow `0.0.0.0/0` so Render can connect.
6. Run `npm run seed` once from your own computer with the Atlas connection string to add the demo data.
