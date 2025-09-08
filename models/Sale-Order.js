const { getDb } = require("../db");
const { ObjectId } = require("mongodb");

let SaleOrder = function (data) {
    this.data = data;
    this.errors = [];
};

function SaleOrderCollection() {
    return getDb().collection("SaleOrder");
}

function SupplierCollection() {
    return getDb().collection("customers")
}

function supplierLedgerCollection() {
    return getDb().collection("customerLedger")
}

// Get the next order number
async function maxNumber() {
    const result = await SaleOrderCollection()
        .aggregate([{ $group: { _id: null, max: { $max: "$orderNo" } } }])
        .toArray();

    const max = result[0]?.max ?? 0; // default 0 if none
    return max + 1;
}

// Get supplier name by ID
async function getSupplierNameById(supplierId) {
    if (!ObjectId.isValid(supplierId)) {
        throw new Error("Invalid supplierId: " + supplierId);
    }

    const supplier = await getDb()
        .collection("customers")
        .findOne({ _id: new ObjectId(supplierId) });

    return supplier ? supplier.custName : "";
}

// Get next orderNo
SaleOrder.prototype.GetorderNo = async function () {
    return await maxNumber();
};

SaleOrder.prototype.validate = async function () {
    if (!this.data.CustomerName || this.data.CustomerName.trim() === "") {
        this.errors.push("Supplier Name must not be empty");
    }

    if (!this.data.ConKanWeight || this.data.ConKanWeight.trim() === "") {
        this.errors.push("Computer Kanta Weight must not be empty");
    }

    if (!this.data.rate || this.data.rate.trim() === "") {
        this.errors.push("Rate must not be empty");
    }
};


// Create purchase order
SaleOrder.prototype.createSaleOrder = function () {
    return new Promise(async (resolve, reject) => {
        try {
            await this.validate()
            if (!this.errors.length) {
                const newOrderNo = await maxNumber();
                const supplierName = await getSupplierNameById(this.data.customerDropdown);

                this.data = {
                    orderNo: newOrderNo,
                    billNo: this.data.billNo,
                    Date: new Date(this.data.orderDate),
                    customerId: new ObjectId(this.data.customerDropdown),
                    customerName: supplierName,
                    truckNumber: this.data.truckNumber,
                    commodity: this.data.commodity,
                    ConKanWeight: parseFloat(this.data.ConKanWeight),
                    tadad: parseFloat(this.data.tadad),
                    bKanKaat: parseFloat(this.data.bKanKaat),
                    bdanaKaat: parseFloat(this.data.bdanaKaat),
                    kamWazJarmana: parseFloat(this.data.kamWazJarmana),
                    rate: parseFloat(this.data.rate),
                    kameeRate: parseFloat(this.data.kameeRate),
                    kulDmg: parseFloat(this.data.kulDmg),
                    safiDmg: parseFloat(this.data.safiDmg),
                    kulKachr: parseFloat(this.data.kulKachr),
                    safiKachar: parseFloat(this.data.safiKachar),
                    kulNami: parseFloat(this.data.kulNami),
                    safiNami: parseFloat(this.data.safiNami),
                    manfiWazan: parseFloat(this.data.manfiWazan),
                    safiWazan: parseFloat(this.data.safiWazan),
                    karayaKanta: parseFloat(this.data.karayaKanta),
                    safiRate: parseFloat(this.data.safiRate),
                    munshiana: parseFloat(this.data.munshiana),
                    kulRaqm: parseFloat(this.data.kulRaqm),
                    Mazdoori: parseFloat(this.data.mazdoori),
                    mazdooriRate: parseFloat(this.data.mazdooriRate),
                    safiRaqm: parseFloat(this.data.safiRaqm),
                    KharKunindaBroker: parseFloat(this.data.KharKunindaBroker),
                    kulSafiRaqm: parseFloat(this.data.kulSafiRaqm),
                };


                let customer = await SupplierCollection().findOne({ custName: supplierName })
                let custPaydue = customer.custPayDue || 0
                let total = custPaydue - this.data.kulSafiRaqm
                await SupplierCollection().findOneAndUpdate({ custName: supplierName }, { $set: { custPayDue: total } })
                await supplierLedgerCollection().insertOne({
                    Date: new Date(),
                    customerName: supplierName,
                    BillNumber: this.data.billNo,
                    Debit: total * (-1),
                    Credit: 0,
                    Details: "Order Number: " + this.data.orderNo,
                    Remaining: total
                })
                await SaleOrderCollection().insertOne(this.data);
                resolve();
            } else {
                reject(this.errors.join(", "));
            }
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = SaleOrder;
