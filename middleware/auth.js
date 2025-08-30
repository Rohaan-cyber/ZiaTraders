// middleware/auth.js
function requireLogin(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        res.redirect("/")
    }
}

module.exports = requireLogin
