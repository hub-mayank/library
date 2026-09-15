const express = require("express");
const Book = require("../models/Book");
const Issue = require("../models/Issue");
const { isLoggedIn, isLibrarian } = require("../middleware/auth");

const router = express.Router();

const notFound = (res) => {
    res.status(404).render("error", { title: "Book not found", message: "This book is not in the catalogue." });
};

const readBook = (body) => {
    return {
        title: (body.title || "").trim(),
        author: (body.author || "").trim(),
        // isbn is saved without dashes or spaces
        isbn: (body.isbn || "").replace(/[-\s]/g, "").toUpperCase(),
        category: body.category,
        totalCopies: Number(body.totalCopies)
    };
};

const checkBook = async (book, bookId) => {
    if (!book.title || !book.author || !book.isbn || !book.category) {
        return "Please fill in all the fields.";
    }
    if (!/^(\d{9}[\dX]|\d{13})$/.test(book.isbn)) {
        return "ISBN should have 10 or 13 digits.";
    }
    if (!Book.categories.includes(book.category)) {
        return "Please choose a category from the list.";
    }
    if (!Number.isInteger(book.totalCopies) || book.totalCopies < 1) {
        return "Total copies should be a whole number, 1 or more.";
    }
    const sameIsbn = await Book.findOne({ isbn: book.isbn, _id: { $ne: bookId } });
    if (sameIsbn) {
        return `"${sameIsbn.title}" already has this ISBN.`;
    }
    return null;
};

router.get("/", isLoggedIn, async (req, res) => {
    const search = (req.query.search || "").trim();
    const category = Book.categories.includes(req.query.category) ? req.query.category : "";
    const filter = {};

    if (search) {
        // escape special characters so a search like "c++" does not break the regex
        const text = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { title: { $regex: text, $options: "i" } },
            { author: { $regex: text, $options: "i" } }
        ];
    }
    if (category) {
        filter.category = category;
    }

    const books = await Book.find(filter).sort({ title: 1 });

    // books this member already asked for or has
    let myBookIds = [];
    if (req.session.user.role === "member") {
        const active = await Issue.find({ member: req.session.user.id, status: { $in: ["pending", "issued"] } });
        myBookIds = active.map((issue) => issue.book.toString());
    }

    res.render("books/index", {
        title: "Catalogue",
        books,
        categories: Book.categories,
        search,
        category,
        myBookIds,
        maxBooks: Issue.rules.maxBooks
    });
});

router.get("/new", isLibrarian, (req, res) => {
    res.render("books/form", {
        title: "Add book",
        book: {},
        categories: Book.categories,
        action: "/books",
        issuedCopies: 0,
        error: null
    });
});

router.post("/", isLibrarian, async (req, res) => {
    const data = readBook(req.body);
    const error = await checkBook(data, null);

    if (error) {
        return res.status(400).render("books/form", {
            title: "Add book",
            book: req.body,
            categories: Book.categories,
            action: "/books",
            issuedCopies: 0,
            error
        });
    }

    await Book.create({ ...data, availableCopies: data.totalCopies });

    req.session.flash = { type: "success", message: `"${data.title}" added to the catalogue.` };
    res.redirect("/books");
});

router.get("/:id/edit", isLibrarian, async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return notFound(res);
    }

    res.render("books/form", {
        title: "Edit book",
        book,
        categories: Book.categories,
        action: `/books/${book._id}/edit`,
        issuedCopies: book.totalCopies - book.availableCopies,
        error: null
    });
});

router.post("/:id/edit", isLibrarian, async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return notFound(res);
    }

    const data = readBook(req.body);
    const issuedCopies = book.totalCopies - book.availableCopies;
    let error = await checkBook(data, book._id);

    // copies that are out with members cannot be removed
    if (!error && data.totalCopies < issuedCopies) {
        error = `${issuedCopies} copies are issued right now, so total copies cannot be less than ${issuedCopies}.`;
    }

    if (error) {
        return res.status(400).render("books/form", {
            title: "Edit book",
            book: { ...req.body, _id: book._id },
            categories: Book.categories,
            action: `/books/${book._id}/edit`,
            issuedCopies,
            error
        });
    }

    book.title = data.title;
    book.author = data.author;
    book.isbn = data.isbn;
    book.category = data.category;
    book.totalCopies = data.totalCopies;
    book.availableCopies = data.totalCopies - issuedCopies;
    await book.save();

    req.session.flash = { type: "success", message: `"${book.title}" updated.` };
    res.redirect("/books");
});

router.post("/:id/delete", isLibrarian, async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        return notFound(res);
    }

    const blocking = await Issue.countDocuments({
        book: book._id,
        $or: [
            { status: { $in: ["pending", "issued"] } },
            { fine: { $gt: 0 }, finePaid: false }
        ]
    });

    if (blocking > 0) {
        req.session.flash = { type: "error", message: `"${book.title}" has pending requests, issued copies or unpaid fines, so it cannot be deleted yet.` };
        return res.redirect("/books");
    }

    await Issue.deleteMany({ book: book._id });
    await Book.deleteOne({ _id: book._id });

    req.session.flash = { type: "success", message: `"${book.title}" removed from the catalogue.` };
    res.redirect("/books");
});

module.exports = router;
