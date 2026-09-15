const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Issue = require("../models/Issue");
const { isGuest } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.user.role === "librarian" ? "/dashboard" : "/my-books");
    }
    res.render("home", { title: "Welcome", rules: Issue.rules });
});

router.get("/register", isGuest, (req, res) => {
    res.render("register", { title: "Register", error: null, form: {} });
});

router.post("/register", isGuest, async (req, res) => {
    const { name, password, confirmPassword } = req.body;
    const email = (req.body.email || "").trim().toLowerCase();
    const form = { name, email };

    let error = null;
    if (!name || !email || !password) {
        error = "Please fill in all the fields.";
    } else if (password.length < 6) {
        error = "Password must be at least 6 characters.";
    } else if (password !== confirmPassword) {
        error = "Passwords do not match.";
    } else if (await User.findOne({ email })) {
        error = "An account with this email already exists.";
    }

    if (error) {
        return res.status(400).render("register", { title: "Register", error, form });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // role is never taken from the form, everyone who signs up is a member
    const newUser = await User.create({ name, email, password: hashedPassword });

    req.session.user = { id: newUser._id, name: newUser.name, role: newUser.role };
    req.session.flash = { type: "success", message: `Welcome, ${newUser.name}! You can now request books.` };
    res.redirect("/books");
});

router.get("/login", isGuest, (req, res) => {
    res.render("login", { title: "Login", error: null, form: {} });
});

router.post("/login", isGuest, async (req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    const found = await User.findOne({ email });

    // same message for both cases, so nobody can check which emails are registered
    if (!found || !(await bcrypt.compare(password, found.password))) {
        return res.status(401).render("login", { title: "Login", error: "Wrong email or password.", form: { email } });
    }

    req.session.user = { id: found._id, name: found.name, role: found.role };
    req.session.flash = { type: "success", message: `Welcome back, ${found.name}.` };
    res.redirect("/");
});

router.post("/logout", (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
    });
});

module.exports = router;
