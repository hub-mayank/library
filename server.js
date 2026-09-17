require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const path = require("path");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const issueRoutes = require("./routes/issues");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const port = process.env.PORT || 3000;

const missing = ["MONGO_URI", "SESSION_SECRET"].filter((name) => !process.env[name]);
if (missing.length > 0) {
    console.log(`missing env variables: ${missing.join(", ")}`);
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("mongodb connected"))
    .catch((err) => {
        console.log("mongodb connection failed:", err.message);
        process.exit(1);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// defaults so every view can use these, even on an error page
app.locals.user = null;
app.locals.flash = null;
app.locals.showDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
});

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", issueRoutes);
app.use("/books", bookRoutes);

app.use((req, res) => {
    res.status(404).render("error", { title: "Page not found", message: "The page you are looking for does not exist." });
});

app.use((err, req, res, next) => {
    // the reply already went out, so let express finish it off
    if (res.headersSent) {
        return next(err);
    }

    // a wrong id in the url
    if (err.name === "CastError") {
        return res.status(404).render("error", { title: "Not found", message: "That record does not exist." });
    }
    console.log(err);
    res.status(500).render("error", { title: "Something went wrong", message: "Please try again in a moment." }, (renderErr, html) => {
        if (renderErr) {
            return res.send("something went wrong");
        }
        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`server is running at ${port}`);
});
