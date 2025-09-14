const validator = require("validator")
const bcrypt = require("bcryptjs")
const { getDb } = require("../db")
const ObjectId = require('mongodb').ObjectId
let maxValue1
let User = function (data, userid) {
    this.data = data
    this.userid = userid
    this.errors = []
}



// Helper to get users collection safely
function usersCollection() {
    return getDb().collection("users")
}

function inventoryCollection() {
    return getDb().collection("inventory")
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
     let bank1Name = this.data.bank1
     let bank2Name = this.data.bank2
     let bank3Name = this.data.bank3
     let bank4Name = this.data.bank4
     let bank5Name = this.data.bank5
    this.data = {
        // this.data fields
        serialNumber: maxValue1,
        username: this.data.username.trim().toLowerCase(),
        isAdmin: this.data.isAdmin,
        password: this.data.password,
        ShopName: this.data.ShopName,
        cash: 0,
       // this.data bank fields
        [bank1Name]: 0,
        [bank2Name]: 0,
        [bank3Name]: 0,
        [bank4Name]: 0,
        [bank5Name]: 0,
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
            this.errors.push("Username must be at least 3 characters.")
        }
        if (this.data.username.length > 30) {
            this.errors.push("Username cannot exceed 30 characters.")
        }
        if (this.data.ShopName == ""){
           this.errors.push("Shop Name cannot be empty.")   
        }
        // banks
       if (this.data.bank1 == ""){
           this.errors.push("Bank 1 cannot be empty.")   
        }
         if (this.data.bank2 == ""){
           this.errors.push("Bank 2 cannot be empty.")   
        }
         if (this.data.bank3 == ""){
           this.errors.push("Bank 3 cannot be empty.")   
        }
            if (this.data.bank4 == ""){
           this.errors.push("Bank 4 cannot be empty.")   
        }
            if (this.data.bank5 == ""){
           this.errors.push("Bank 5 cannot be empty.")   
        }

        // admin
        if (!this.data.isAdmin) {
            this.errors.push("Please select if user is Admin or not.");
        } else if (this.data.isAdmin !== "yes" && this.data.isAdmin !== "no") {
            this.errors.push("Invalid value for Admin selection.");
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
     await    this.cleanUp()
        await this.validate()

        if (!this.errors.length) {
            // hash password before saving
            const salt = await bcrypt.genSalt(10)
            this.data.password = await bcrypt.hash(this.data.password, salt)

         let Inserteddata = await usersCollection().insertOne(this.data)
           let mungi = await inventoryCollection().insertOne({
                commodity: "Mungi",
               value: 0,
               userid: new ObjectId(Inserteddata.insertedId),
           })
            
               let bajara = await inventoryCollection().insertOne({
                commodity: "Bajara",
               value: 0,
               userid: new ObjectId(Inserteddata.insertedId),
           })
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.findInventory = async function () {
    let inventory = await inventoryCollection().findOne({ 
        userid: new ObjectId(this.userid),
        commodity: "Mungi"
    })
    return inventory || 0
}

User.prototype.findInventoryBajara = async function () {
    let inventory = await inventoryCollection().findOne({ 
        userid: new ObjectId(this.userid),
        commodity: "Bajara"
    })
    return inventory || 0
}


// model method for login check
User.prototype.login = function () {
    return new Promise(async (resolve, reject) => {
       await  this.cleanUp()
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















