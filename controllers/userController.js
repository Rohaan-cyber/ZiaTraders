const User = require("../models/User");

exports.home = function (req, res) {
    // If user is already logged in, redirect to dashboard
    if (req.session && req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("login-signup");
};

exports.register = function (req, res) {
    let user = new User(req.body);
    user.register()
        .then(() => {
            req.flash('success_msg', 'Registration successful! You can now log in');
            res.redirect('/'); // redirect to login/signup page
        })
        .catch((errors) => {
            errors.forEach(err => req.flash('register_error', err));
            res.redirect('/'); // redirect back to show errors
        });
};


exports.login = function (req, res) {
    let user = new User(req.body);
    user.login()
        .then(userDoc => {
            req.session.user = { id: userDoc._id, username: userDoc.username, ShopName: userDoc.ShopName || 'You dont have a shop name' };
            req.session.save(() => {
                req.flash('success_msg', `✅ Welcome ${userDoc.username}! You are logged in.`);
                res.redirect("/dashboard"); // <- redirect to dashboard
            });
        })
        .catch((err) => {
            req.flash('login_error', "Invalid username / password");
            res.redirect("/");  // login page
        });
};


// Fixed logout
exports.logout = function (req, res) {
    if (req.session) {
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.redirect("/"); // back to login
        });
    } else {
        res.redirect("/");
    }
};


