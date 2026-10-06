const mongoose = require("mongoose");

const categories = ["Fiction", "Science", "Technology", "History", "Biography", "Self Help", "Children"];

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: categories, required: true },
    totalCopies: { type: Number, required: true, min: 1 },
    availableCopies: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);
Book.categories = categories;

module.exports = Book;
