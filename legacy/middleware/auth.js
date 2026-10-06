const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        req.session.flash = { type: "error", message: "Please login first." };
        return res.redirect("/login");
    }
    next();
};

const isLibrarian = (req, res, next) => {
    if (!req.session.user) {
        req.session.flash = { type: "error", message: "Please login first." };
        return res.redirect("/login");
    }
    if (req.session.user.role !== "librarian") {
        req.session.flash = { type: "error", message: "Only the librarian can do that." };
        return res.redirect("/");
    }
    next();
};

const isMember = (req, res, next) => {
    if (!req.session.user) {
        req.session.flash = { type: "error", message: "Please login first." };
        return res.redirect("/login");
    }
    if (req.session.user.role !== "member") {
        req.session.flash = { type: "error", message: "Only members can borrow books." };
        return res.redirect("/");
    }
    next();
};

const isGuest = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/");
    }
    next();
};

module.exports = { isLoggedIn, isLibrarian, isMember, isGuest };
