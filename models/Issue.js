const mongoose = require("mongoose");

// library rules, change the numbers here
const rules = {
    maxBooks: 3,
    loanDays: 14,
    finePerDay: 5
};

const oneDay = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    return day;
};

const issueSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "issued", "returned", "rejected"], default: "pending" },
    requestDate: { type: Date, default: Date.now },
    issueDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    fine: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false }
});

// whole days after the due date, a returned book counts till the day it came back
issueSchema.methods.daysLate = function () {
    if (!this.dueDate) {
        return 0;
    }
    const end = this.returnDate || new Date();
    const days = Math.round((startOfDay(end) - startOfDay(this.dueDate)) / oneDay);
    return days > 0 ? days : 0;
};

issueSchema.methods.daysLeft = function () {
    return Math.round((startOfDay(this.dueDate) - startOfDay(new Date())) / oneDay);
};

issueSchema.methods.isOverdue = function () {
    return this.status === "issued" && this.daysLate() > 0;
};

issueSchema.methods.currentFine = function () {
    if (this.status === "returned") {
        return this.fine;
    }
    if (this.status === "issued") {
        return this.daysLate() * rules.finePerDay;
    }
    return 0;
};

const Issue = mongoose.model("Issue", issueSchema);

Issue.rules = rules;

Issue.overdueFilter = () => {
    return { status: "issued", dueDate: { $lt: startOfDay(new Date()) } };
};

module.exports = Issue;
