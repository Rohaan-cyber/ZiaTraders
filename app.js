const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const { connectToDb } = require('./db')
const router = require('./router')
const Customer = require('./models/Customers') // <-- import for flush

const app = express()

// Middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static("public"))
app.set("views", "views")
app.set("view engine", "ejs")

// Sessions (stored in MongoDB)
app.use(session({
    name: 'connect.sid', // keep default name
    secret: process.env.SESSIONSECRET,
    store: MongoStore.create({
        mongoUrl: process.env.CONNECTIONSTRING,
        touchAfter: 24 * 3600 // only update session once per day if unchanged
    }),
    resave: false,             // do not save session if unmodified
    saveUninitialized: false,  // only save if something is stored
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}))

// Flash messages (must come AFTER session)
app.use(flash())

// Make flash messages available in all templates
// Make flash messages available in all templates
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg') || [];
    res.locals.register_error = req.flash('register_error') || [];
    res.locals.login_error = req.flash('login_error') || [];
    next();
});


// Router
app.use("/", router)

// 🟢 Flush endpoint
app.post("/flush", async (req, res) => {
    try {
        await Customer.flushToDb()
        res.json({ success: true, message: "Flushed memory customers to DB" })
    } catch (err) {
        console.error("❌ Flush failed:", err)
        res.status(500).json({ success: false, message: "Flush failed" })
    }
})

// Start server only after DB is ready
connectToDb()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`)
        })
    })
    .catch(err => console.error("❌ DB connection failed:", err))

module.exports = app

