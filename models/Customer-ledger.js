const { getDb } = require("../db");
const ObjectId = require('mongodb').ObjectId


let CustLedger = function (legdata, userid) {
    this.legdata = legdata;
    this.userid = userid
    this.errors = [];
};



 function custLedgerCollection() {
     return getDb().collection("customerLedger");
 }

function customersCollection() {
    return getDb().collection("customers");
}

async function getCustomerNameById(customerId) {
    const customer = await getDb().collection("customers").findOne({ _id: new ObjectId(customerId) });
    return customer ? customer.custName : '';
}



CustLedger.prototype.validate = function () {
    if (!this.legdata.Date) this.errors.push("Date Cannot be empty");
    if (!this.legdata.BillNumber) this.errors.push("Bill Number Cannot be Empty");
    if (!this.legdata.DebitCredit) this.errors.push("Debit / Credit cannot be empty");
    if (!this.legdata.DebitCreditVal) this.errors.push("field cannot be empty");
    if (!this.legdata.Details) this.errors.push("Details cannot be empty");
};

CustLedger.prototype.createCustLedger = function () {
    return new Promise(async (resolve, reject) => {
        this.validate();
        if (!this.errors.length) {
            let debitVal = parseFloat(this.legdata.DebitCreditVal) || 0;
            const custPayDue = parseFloat(this.legdata.custPayDue) || 0;
            const customerName = await getCustomerNameById(this.legdata.customerDropdown);

            let total;
            let creditvalue, debitvalue;
            if (this.legdata.DebitCredit == "Credit") {
                creditvalue = debitVal;
                debitvalue = 0;
            } else {
                creditvalue = 0;
                debitvalue = debitVal;
            }

            if (this.legdata.DebitCredit == "Credit") {
                if (this.legdata.paymentType == "Credit") {
                    total = debitVal + custPayDue;
                } else {
                    total = debitVal - custPayDue;
                }
            } else {
                if (this.legdata.paymentType == "Credit") {
                    total = custPayDue - debitVal;
                } else {
                    total = (debitVal + custPayDue) * (-1);
                }
            }

            this.legdata = {
                Date: new Date(this.legdata.Date),
                CustomerName: customerName,
                BillNumber: parseInt(this.legdata.BillNumber),
                Debit: debitvalue,
                Credit: creditvalue,
                Details: this.legdata.Details,
                Remaining: total,
                authorId: new ObjectId(this.userid),   // ✅ keep consistent with query
                createdAt: new Date()                  // ✅ add timestamp
            };

            await custLedgerCollection().insertOne(this.legdata);
            customersCollection().findOneAndUpdate(
                { custName: customerName },
                { $set: { custPayDue: total } }
            );
            resolve();
        } else {
            reject(this.errors);
        }
    });
};

CustLedger.prototype.findTransactionById = async function () {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    try {
        const CustTransactions = await custLedgerCollection()
            .find({
                Date: { $gte: startOfDay, $lte: endOfDay }
            })
            .toArray();
        return CustTransactions;
    } catch (e) {
        console.error("Error fetching transactions:", e);
        return [];
    }
};

CustLedger.prototype.createCustomerTran =  function () {
    return new Promise(async (resolve, reject) => {
        let customerName  = this.legdata.CustomerName2
        let returnTransaction = await custLedgerCollection().find({
            CustomerName: customerName
        }).toArray()

        if (returnTransaction.length > 0) {
            resolve(returnTransaction)
        } else {
            reject("No transactions found")
        }

    })
}

module.exports = CustLedger;

