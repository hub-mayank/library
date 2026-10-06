const express = require("express");
const Book = require("../models/Book");
const Issue = require("../models/Issue");
const { isLibrarian, isMember } = require("../middleware/auth");

const router = express.Router();

const goBack = (req, res, fallback) => {
    res.redirect(req.get("Referrer") || fallback);
};

router.post("/books/:id/request", isMember, async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).render("error", { title: "Book not found", message: "This book is not in the catalogue." });
    }

    const memberId = req.session.user.id;
    const active = await Issue.find({ member: memberId, status: { $in: ["pending", "issued"] } });
    const alreadyHas = active.some((issue) => issue.book.toString() === book._id.toString());

    let error = null;
    if (alreadyHas) {
        error = `You have already requested or borrowed "${book.title}".`;
    } else if (book.availableCopies === 0) {
        error = `No copies of "${book.title}" are on the shelf right now.`;
    } else if (active.length >= Issue.rules.maxBooks) {
        error = `You can have at most ${Issue.rules.maxBooks} books at a time, pending requests included.`;
    }

    if (error) {
        req.session.flash = { type: "error", message: error };
        return goBack(req, res, "/books");
    }

    await Issue.create({ book: book._id, member: memberId });

    req.session.flash = { type: "success", message: `Request sent for "${book.title}". The librarian will approve it soon.` };
    res.redirect("/my-books");
});

router.get("/my-books", isMember, async (req, res) => {
    const issues = await Issue.find({ member: req.session.user.id })
        .populate("book", "title author")
        .sort({ requestDate: -1 });

    const current = issues.filter((issue) => issue.status === "pending" || issue.status === "issued");
    const history = issues.filter((issue) => issue.status === "returned" || issue.status === "rejected");

    let unpaidFine = 0;
    issues.forEach((issue) => {
        if (!issue.finePaid) {
            unpaidFine += issue.currentFine();
        }
    });

    res.render("issues/my-books", {
        title: "My books",
        current,
        history,
        unpaidFine,
        maxBooks: Issue.rules.maxBooks
    });
});

router.get("/issues", isLibrarian, async (req, res) => {
    const tabs = ["pending", "issued", "overdue", "fines", "returned", "rejected"];
    const tab = tabs.includes(req.query.tab) ? req.query.tab : "pending";

    const filters = {
        pending: { status: "pending" },
        issued: { status: "issued" },
        overdue: Issue.overdueFilter(),
        fines: { status: "returned", fine: { $gt: 0 }, finePaid: false },
        returned: { status: "returned" },
        rejected: { status: "rejected" }
    };

    const counts = {};
    for (const name of tabs) {
        counts[name] = await Issue.countDocuments(filters[name]);
    }

    const issues = await Issue.find(filters[tab])
        .populate("book", "title author availableCopies")
        .populate("member", "name email")
        .sort({ requestDate: -1 });

    res.render("issues/index", { title: "Issues", tabs, tab, counts, issues });
});

router.post("/issues/:id/approve", isLibrarian, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("book", "title");

    if (!issue || issue.status !== "pending") {
        req.session.flash = { type: "error", message: "This request is not pending any more." };
        return goBack(req, res, "/issues");
    }

    // take one copy off the shelf, but only if one is still there
    const book = await Book.findOneAndUpdate(
        { _id: issue.book._id, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } }
    );

    if (!book) {
        req.session.flash = { type: "error", message: `No copies of "${issue.book.title}" are left to issue.` };
        return goBack(req, res, "/issues");
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + Issue.rules.loanDays);

    issue.status = "issued";
    issue.issueDate = today;
    issue.dueDate = dueDate;
    await issue.save();

    req.session.flash = { type: "success", message: `"${issue.book.title}" issued. Due back in ${Issue.rules.loanDays} days.` };
    goBack(req, res, "/issues");
});

router.post("/issues/:id/reject", isLibrarian, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("book", "title");

    if (!issue || issue.status !== "pending") {
        req.session.flash = { type: "error", message: "This request is not pending any more." };
        return goBack(req, res, "/issues");
    }

    issue.status = "rejected";
    await issue.save();

    req.session.flash = { type: "success", message: `Request for "${issue.book.title}" rejected.` };
    goBack(req, res, "/issues");
});

router.post("/issues/:id/return", isLibrarian, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("book", "title");

    if (!issue || issue.status !== "issued") {
        req.session.flash = { type: "error", message: "This book is not issued right now." };
        return goBack(req, res, "/issues");
    }

    issue.status = "returned";
    issue.returnDate = new Date();
    issue.fine = issue.daysLate() * Issue.rules.finePerDay;
    await issue.save();

    await Book.updateOne({ _id: issue.book._id }, { $inc: { availableCopies: 1 } });

    let message = `"${issue.book.title}" returned on time.`;
    if (issue.fine > 0) {
        message = `"${issue.book.title}" returned ${issue.daysLate()} day(s) late. Fine: ₹${issue.fine}.`;
    }

    req.session.flash = { type: "success", message };
    goBack(req, res, "/issues");
});

router.post("/issues/:id/pay", isLibrarian, async (req, res) => {
    const issue = await Issue.findById(req.params.id).populate("book", "title");

    if (!issue || issue.status !== "returned" || issue.fine === 0 || issue.finePaid) {
        req.session.flash = { type: "error", message: "There is no unpaid fine on this record." };
        return goBack(req, res, "/issues");
    }

    issue.finePaid = true;
    await issue.save();

    req.session.flash = { type: "success", message: `Fine of ₹${issue.fine} for "${issue.book.title}" marked as paid.` };
    goBack(req, res, "/issues");
});

module.exports = router;
