const { getDb } = require("../db")
const ObjectId = require('mongodb').ObjectId

let Supplier = function (data, userId) {
    this.data = data || {}
    this.userId = userId
    this.errors = []
}

let maxValue1

function suppliersCollection() {
    return getDb().collection("suppliers")
}

async function maxNumber() {
    maxValue1 = (await suppliersCollection()
        .aggregate([{ $group: { _id: null, max: { $max: "$supplierId" } } }])
        .toArray())[0]?.max ?? 0

    maxValue1++  // increment for next supplier
}

// Clean and prepare data
Supplier.prototype.cleanUp = async function () {
    if (typeof this.data.supName != "string") { this.data.supName = "" }       // fixed typo
    if (typeof this.data.supPhoneNum != "string") { this.data.supPhoneNum = "" }
    if (typeof this.data.supArea != "string") { this.data.supArea = "" }
    if (typeof this.data.supProvince != "string") { this.data.supProvince = "" }

    await maxNumber()

    this.data = {
        supplierId: maxValue1,
        supName: this.data.supName.trim(),
        supPayDue: 0,
        supPhoneNum: this.data.supPhoneNum.trim(),
        supArea: this.data.supArea.trim(),
        supProvince: this.data.supProvince.trim(),
        supAuthor: new ObjectId(this.userId)
    }
}

// Validate required fields
Supplier.prototype.validate = async function () {
    if (this.data.supName === "") { this.errors.push("You must provide a supplier name.") }
    if (this.data.supPhoneNum === "") { this.errors.push("You must provide a supplier Phone Number.") }
    if (this.data.supArea === "") { this.errors.push("You must provide a supplier Area.") }
    if (this.data.supProvince === "") { this.errors.push("You must provide a supplier Province.") }

    if (this.data.supName != "") {
        let supNameExists = await suppliersCollection().findOne({ supName: this.data.supName })
        if (supNameExists) { this.errors.push("That Supplier Name is already being used.") }
    }
}

// Add supplier to DB
Supplier.prototype.addSupplier = async function () {
    return new Promise(async (resolve, reject) => {
        await this.cleanUp()   // await cleanup
        await this.validate()
        if (this.errors.length > 0) return reject(this.errors)
        try {
            await suppliersCollection().insertOne(this.data)
            resolve(this.data)  // return object with proper supplierId
        } catch (err) {
            reject(err)
        }
    })
}

// Fetch all suppliers for user
Supplier.prototype.findSupplier = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let suppliers = await suppliersCollection().find({ supAuthor: new ObjectId(this.userId) }).toArray()
            resolve(suppliers)
        } catch (err) {
            reject(err)
        }
    })
}

// Count suppliers for user
Supplier.prototype.findSupplierLength = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let suppliers = await suppliersCollection().find({ supAuthor: new ObjectId(this.userId) }).toArray()
            resolve(suppliers.length)
        } catch (err) {
            reject(err)
        }
    })
}

// Sum supplier payables
Supplier.prototype.findSupplierAmount = function () {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await suppliersCollection().aggregate([
                { $match: { supAuthor: new ObjectId(this.userId) } },
                { $group: { _id: null, total: { $sum: "$supPayDue" } } }
            ]).toArray()
            resolve(result.length > 0 ? result[0].total : 0)
        } catch (err) {
            reject(err)
        }
    })
}

// Delete supplier by ID
Supplier.DeleteSupplier = async function (supplierId, supId) {
    const result = await suppliersCollection().deleteOne({
        _id: new ObjectId(supplierId),
        supAuthor: new ObjectId(supId)
    })
    return result
}

module.exports = Supplier
