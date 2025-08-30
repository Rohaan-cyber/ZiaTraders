const { getDb } = require("../db")
const ObjectId = require('mongodb').ObjectId

let Customer = function (data, userId) {
    this.data = data || {}  // <-- default to empty object
    this.userId = userId
    this.errors = []
}

let maxValue1

function customersCollection() {
    return getDb().collection("customers")
}

async function maxNumber() {
    maxValue1 = (await customersCollection()
        .aggregate([{ $group: { _id: null, max: { $max: "$customerId" } } }])
        .toArray())[0]?.max ?? null;

    maxValue1++
}


Customer.prototype.cleanUp = async function () {
    if (!this.data) this.data = {}

    if (typeof this.data.custName != "string") { this.data.custName = "" }
    if (typeof this.data.custPhoneNum != "string") { this.data.custPhoneNum = "" }
    if (typeof this.data.custArea != "string") { this.data.custArea = "" }
    if (typeof this.data.custProvince != "string") { this.data.custProvince = "" }

    await maxNumber()

    this.data = {
        customerId: maxValue1,
        custName: this.data.custName.trim(),
        custPayDue: 0,
        custPhoneNum: this.data.custPhoneNum.trim(),
        custArea: this.data.custArea.trim(),
        custProvince: this.data.custProvince.trim(),
        custAuthor: new ObjectId(this.userId)
    }
}


Customer.prototype.validate = async function () {
    if (this.data.custName == "") { this.errors.push("You must provide a customer name.") }
    if (this.data.custPhoneNum == "") { this.errors.push("You must provide a customer Phone Number.") }
    if (this.data.custArea == "") { this.errors.push("You must provide a customer Area.") }
    if (this.data.custProvince == "") { this.errors.push("You must provide a customer Province.") }

    if (this.data.custName != "") {
        let custNameExists = await customersCollection().findOne({ custName: this.data.custName })
        if (custNameExists) { this.errors.push("That Customer Name is already being used.") }
    }
}

Customer.prototype.addCustomer = async function () {
    return new Promise(async (resolve, reject) => {
        await this.cleanUp()
        await this.validate()

        if (!this.errors.length) {
            const result = await customersCollection().insertOne(this.data)

            // fetch the saved customer with the insertedId
            const savedCustomer = await customersCollection().findOne({ _id: result.insertedId })

            resolve(savedCustomer)   // ✅ send full object back
        } else {
            reject(this.errors)
        }
    })
}


Customer.prototype.findCustomers = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let customers = await customersCollection().find({custAuthor: new ObjectId(this.userId)}).toArray()
            resolve(customers)  // send results back
        } catch (err) {
            reject(err)  // handle errors
        }
    })
}

Customer.prototype.findCustomersLength = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let customers = await customersCollection().find({ custAuthor: new ObjectId(this.userId) }).toArray()
            resolve(customers.length)  // send results back
        } catch (err) {
            reject(err)  // handle errors
        }
    })
}

Customer.prototype.findCustomerAmount = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await customersCollection().aggregate([
                { $match: { custAuthor: new ObjectId(this.userId) } },     // only this user's docs
                { $group: { _id: null, total: { $sum: "$custPayDue" } } } // sum "amount" field
            ]).toArray();

 

            // ✅ resolve the promise
            resolve(result.length > 0 ? result[0].total : 0);
        } catch (err) {
            reject(err);
        }
    })
}

Customer.DeleteCustomer = async function (customerId, userId) {
    const result = await customersCollection().deleteOne({
        _id: new ObjectId(customerId),
        custAuthor: new ObjectId(userId)  // ensure only owner can delete
    })
    return result
}


module.exports = Customer