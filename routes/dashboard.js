const express = require("express");
const Book = require("../models/Book");
const Issue = require("../models/Issue");
const { isLibrarian } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", isLibrarian, async (req, res) => {
    const books = await Book.find();

    let totalCopies = 0;
    let availableCopies = 0;
    books.forEach((book) => {
        totalCopies += book.totalCopies;
        availableCopies += book.availableCopies;
    });

    const issuedCount = await Issue.countDocuments({ status: "issued" });
    const pendingCount = await Issue.countDocuments({ status: "pending" });

    const overdue = await Issue.find(Issue.overdueFilter())
        .populate("book", "title")
        .populate("member", "name")
        .sort({ dueDate: 1 });

    const pending = await Issue.find({ status: "pending" })
        .populate("book", "title")
        .populate("member", "name")
        .sort({ requestDate: 1 })
        .limit(5);

    // count how many times each book has been issued
    const borrowed = await Issue.aggregate([
        { $match: { status: { $in: ["issued", "returned"] } } },
        { $group: { _id: "$book", times: { $sum: 1 } } },
        { $sort: { times: -1, _id: 1 } },
        { $limit: 5 }
    ]);

    const mostBorrowed = [];
    for (const item of borrowed) {
        const book = await Book.findById(item._id);
        if (book) {
            mostBorrowed.push({ book, times: item.times });
        }
    }

    let overdueFine = 0;
    overdue.forEach((issue) => {
        overdueFine += issue.currentFine();
    });

    const unpaid = await Issue.find({ status: "returned", fine: { $gt: 0 }, finePaid: false });
    let unpaidFine = 0;
    unpaid.forEach((issue) => {
        unpaidFine += issue.fine;
    });

    res.render("dashboard", {
        title: "Dashboard",
        totalBooks: books.length,
        totalCopies,
        availableCopies,
        issuedCount,
        pendingCount,
        overdue,
        pending,
        mostBorrowed,
        overdueFine,
        unpaidFine
    });
});

module.exports = router;
