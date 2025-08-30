const validator = require("validator")
const bcrypt = require("bcryptjs")
const { getDb } = require("../db")
let maxValue1
let User = function (data) {
    this.data = data
    this.errors = []
}



// Helper to get users collection safely
function usersCollection() {
    return getDb().collection("users")
}

async function maxNumber() {
     maxValue1 = (await usersCollection()
        .aggregate([{ $group: { _id: null, max: { $max: "$serialNumber" } } }])
        .toArray())[0]?.max ?? null;

     maxValue1++
}

let srNo = 1;


User.prototype.cleanUp = async function () {
   await maxNumber()

    this.data = {
        serialNumber: maxValue1,
        username: this.data.username.trim().toLowerCase(),
        isAdmin: this.data.isAdmin,
        password: this.data.password
    }
}

User.prototype.validate = function () {
    return new Promise(async (resolve) => {
        if (this.data.username == "") this.errors.push("You must provide a username.")
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push("Username can only contain letters and numbers.")
        }
        if (this.data.password == "") this.errors.push("You must provide a password.")
        if (this.data.password.length > 0 && this.data.password.length < 12) {
            this.errors.push("Password must be at least 12 characters.")
        }
        if (this.data.password.length > 50) {
            this.errors.push("Password cannot exceed 50 characters.")
        }
        if (this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("Username must be at least 4 characters.")
        }
        if (this.data.username.length > 30) {
            this.errors.push("Username cannot exceed 35 characters.")
        }

        // Check uniqueness only if inputs are valid
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection().findOne({ username: this.data.username })
            if (usernameExists) this.errors.push("That username is already taken.")
        }


        resolve()
    })
}

User.prototype.register = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate()

        if (!this.errors.length) {
            // hash password before saving
            const salt = await bcrypt.genSalt(10)
            this.data.password = await bcrypt.hash(this.data.password, salt)

            await usersCollection().insertOne(this.data)
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

// model method for login check
User.prototype.login = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        try {
            const user = await usersCollection().findOne({ username: this.data.username })
            if (user && await bcrypt.compare(this.data.password, user.password)) {
                resolve(user)
            } else {
                reject("Invalid username / password")
            }
        } catch (err) {
            reject("Something went wrong. Please try again.")
        }
    })
}

module.exports = User
