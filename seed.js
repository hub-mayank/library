// adds a librarian, three members, books and issue records for the demo
// run with: npm run seed  (it clears the old library data first)

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Book = require("./models/Book");
const Issue = require("./models/Issue");

const now = new Date();

const daysAgo = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
};

const books = [
    { title: "The God of Small Things", author: "Arundhati Roy", isbn: "9780679457312", category: "Fiction", totalCopies: 3 },
    { title: "The White Tiger", author: "Aravind Adiga", isbn: "9781416562603", category: "Fiction", totalCopies: 3 },
    { title: "Malgudi Days", author: "R. K. Narayan", isbn: "9780143039655", category: "Fiction", totalCopies: 2 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "Fiction", totalCopies: 2 },
    { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "9780192860920", category: "Science", totalCopies: 2 },
    { title: "Cosmos", author: "Carl Sagan", isbn: "9780345539434", category: "Science", totalCopies: 1 },
    { title: "The Gene", author: "Siddhartha Mukherjee", isbn: "9781476733526", category: "Science", totalCopies: 2 },
    { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", category: "Technology", totalCopies: 2 },
    { title: "The Pragmatic Programmer", author: "Andrew Hunt and David Thomas", isbn: "9780201616224", category: "Technology", totalCopies: 3 },
    { title: "You Don't Know JS Yet", author: "Kyle Simpson", isbn: "9798602477429", category: "Technology", totalCopies: 2 },
    { title: "India After Gandhi", author: "Ramachandra Guha", isbn: "9780060958589", category: "History", totalCopies: 2 },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "History", totalCopies: 3 },
    { title: "The Discovery of India", author: "Jawaharlal Nehru", isbn: "9780143031031", category: "History", totalCopies: 1 },
    { title: "Wings of Fire", author: "A. P. J. Abdul Kalam", isbn: "9788173711466", category: "Biography", totalCopies: 4 },
    { title: "Steve Jobs", author: "Walter Isaacson", isbn: "9781451648539", category: "Biography", totalCopies: 2 },
    { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", category: "Self Help", totalCopies: 4 },
    { title: "Ikigai", author: "Hector Garcia and Francesc Miralles", isbn: "9780143130727", category: "Self Help", totalCopies: 2 },
    { title: "Panchatantra Stories", author: "Vishnu Sharma", isbn: "9788171674510", category: "Children", totalCopies: 3 },
    { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", isbn: "9780142410318", category: "Children", totalCopies: 2 },
    { title: "Harry Potter and the Philosopher's Stone", author: "J. K. Rowling", isbn: "9781408855652", category: "Children", totalCopies: 3 }
];

// issued and returned are "days ago", a negative number would be in the future
const records = [
    { book: "Atomic Habits", member: "aarav", status: "issued", issued: 5 },
    { book: "Clean Code", member: "aarav", status: "issued", issued: 20 },
    { book: "Sapiens", member: "aarav", status: "pending", requested: 1 },
    { book: "Clean Code", member: "priya", status: "issued", issued: 16 },
    { book: "Wings of Fire", member: "priya", status: "returned", issued: 30, returned: 12 },
    { book: "The White Tiger", member: "priya", status: "returned", issued: 25, returned: 15 },
    { book: "Cosmos", member: "priya", status: "pending", requested: 0 },
    { book: "Malgudi Days", member: "rohan", status: "issued", issued: 11 },
    { book: "Atomic Habits", member: "rohan", status: "returned", issued: 40, returned: 23, finePaid: true },
    { book: "Ikigai", member: "rohan", status: "returned", issued: 35, returned: 24 },
    { book: "Harry Potter and the Philosopher's Stone", member: "rohan", status: "rejected", requested: 3 },
    { book: "Atomic Habits", member: "priya", status: "returned", issued: 60, returned: 50 },
    { book: "Wings of Fire", member: "aarav", status: "returned", issued: 55, returned: 45 },
    { book: "Atomic Habits", member: "aarav", status: "returned", issued: 80, returned: 70 },
    { book: "The White Tiger", member: "rohan", status: "returned", issued: 70, returned: 58 },
    { book: "Clean Code", member: "rohan", status: "returned", issued: 90, returned: 78 }
];

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("mongodb connected");

    await Issue.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.collection("sessions").deleteMany({});

    const librarianPassword = await bcrypt.hash("librarian123", 10);
    const memberPassword = await bcrypt.hash("member123", 10);

    await User.create({ name: "Meera Iyer", email: "librarian@library.com", password: librarianPassword, role: "librarian" });

    const members = {
        aarav: await User.create({ name: "Aarav Sharma", email: "aarav@demo.com", password: memberPassword }),
        priya: await User.create({ name: "Priya Singh", email: "priya@demo.com", password: memberPassword }),
        rohan: await User.create({ name: "Rohan Patel", email: "rohan@demo.com", password: memberPassword })
    };

    const savedBooks = await Book.insertMany(books.map((book) => ({ ...book, availableCopies: book.totalCopies })));
    const findBook = (title) => savedBooks.find((book) => book.title === title);

    for (const record of records) {
        const issue = new Issue({
            book: findBook(record.book)._id,
            member: members[record.member]._id,
            status: record.status,
            requestDate: daysAgo(record.issued !== undefined ? record.issued + 1 : record.requested)
        });

        if (record.status === "issued" || record.status === "returned") {
            issue.issueDate = daysAgo(record.issued);
            issue.dueDate = daysAgo(record.issued - Issue.rules.loanDays);
        }

        if (record.status === "returned") {
            issue.returnDate = daysAgo(record.returned);
            issue.fine = issue.daysLate() * Issue.rules.finePerDay;
            issue.finePaid = record.finePaid || false;
        }

        await issue.save();
    }

    // copies still out with members are not on the shelf
    for (const book of savedBooks) {
        const out = await Issue.countDocuments({ book: book._id, status: "issued" });
        book.availableCopies = book.totalCopies - out;
        await book.save();
    }

    console.log(`added ${savedBooks.length} books and ${records.length} issue records`);
    console.log("librarian: librarian@library.com / librarian123");
    console.log("members:   aarav@demo.com, priya@demo.com, rohan@demo.com / member123");

    await mongoose.disconnect();
};

seed().catch((err) => {
    console.log("seed failed:", err.message);
    process.exit(1);
});
