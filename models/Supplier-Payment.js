const { getDb } = require("../db");
const ObjectId = require('mongodb').ObjectId


let SuppLedger = function (legdata) {
    this.legdata = legdata;
    console.log(legdata)
    this.errors = [];
};



function suppLedgerCollection() {
    return getDb().collection("supplierLedger");
}

function suplliersCollection() {
    return getDb().collection("suppliers");
}

async function getSupplierNameById(supplierId) {
    const supplier = await getDb().collection("suppliers").findOne({ _id: new ObjectId(supplierId) });
    return supplier ? supplier.supName : '';
}



SuppLedger.prototype.validate = function () {
    if (!this.legdata.Date) this.errors.push("Date Cannot be empty");
    if (!this.legdata.BillNumber) this.errors.push("Bill Number Cannot be Empty");
    if (!this.legdata.DebitCredit) this.errors.push("Debit / Credit cannot be empty");
    if (!this.legdata.DebitCreditVal) this.errors.push("field cannot be empty");
    if (!this.legdata.Details) this.errors.push("Details cannot be empty");
};

SuppLedger.prototype.createSuppLedger = function () {
    return new Promise(async (resolve, reject) => {

        this.validate();       // validate first
        if (!this.errors.length) {
            let debitVal = parseFloat(this.legdata.DebitCreditVal) || 0;
            const custPayDue = parseFloat(this.legdata.custPayDue) || 0;
            const supplierName = await getSupplierNameById(this.legdata.supplierDropdown);
            let total;
            let creditvalue
            let debitvalue
            if (this.legdata.DebitCredit == "Credit") {
                creditvalue = debitVal
                debitvalue = 0
            } else {
                creditvalue = 0
                debitvalue = debitVal
            }
            if (this.legdata.DebitCredit == "Credit") {
                console.log(this.legdata.paymentType)
                if (this.legdata.paymentType == "Credit") {
                    total = debitVal + custPayDue
                } else {
                    total = debitVal - custPayDue
                }
            } else {
                if (this.legdata.paymentType == "Credit") {
                    total = custPayDue - debitVal
                } else {
                    total = (debitVal + custPayDue) * (-1)
                }
            }
            this.legdata = {
                Date: new Date(this.legdata.Date),
                SupplierName: supplierName,   // the name
                BillNumber: parseInt(this.legdata.BillNumber),
                Debit: debitvalue,
                credit: creditvalue,
                Details: this.legdata.Details,
                Remaining: total
            };
            await suppLedgerCollection().insertOne(this.legdata);
            suplliersCollection().findOneAndUpdate({ supName: supplierName }, { $set: { supPayDue: total } })
            resolve();
        } else {
            reject(this.errors);
        }
    });
};

SuppLedger.prototype.SuppfindTransactionById = async function () {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        try {
            const SuppTransactions = await suppLedgerCollection()
                .find({
                    Date: { $gte: startOfDay, $lte: endOfDay }
                })
                .toArray();
            return SuppTransactions;
        } catch (e) {
            console.error("Error fetching transactions:", e);
            return [];
        }
}

SuppLedger.prototype.createSuppTran = function () {
    return new Promise(async (resolve, reject) => {
        let supplierName = this.legdata.SupplierName2
        let returnTransaction = await suppLedgerCollection().find({
            SupplierName: supplierName
        }).toArray()

        if (returnTransaction.length > 0) {
            resolve(returnTransaction)
        } else {
            reject("No transactions found")
        }

    })
}

module.exports = SuppLedger;
