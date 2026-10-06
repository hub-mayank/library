# Manual smoke test

- [ ] Register a new member account.
- [ ] Log in with the new member account.
- [ ] Browse books and request an available book.
- [ ] Request the same book again and confirm the duplicate-request message.
- [ ] Request three active books and confirm the fourth request is blocked.
- [ ] Cancel a pending request.
- [ ] Log in as the demo librarian and approve a pending request.
- [ ] Return an issued loan after its due date and confirm the fine.
- [ ] Mark the fine as paid.
- [ ] Confirm librarian/member role redirects.
- [ ] Visit `/issues` directly as a member and confirm access is denied.
- [ ] Confirm dashboard numbers match the corresponding Issues tabs.
- [ ] Submit six wrong logins and confirm the sixth is rate limited with a retry time.
- [ ] Open a book with a missing Open Library cover and confirm the initials fallback says
      “No cover found”.
- [ ] Search for a term, move through previous/next pagination, and confirm the
      search term remains in the links.
