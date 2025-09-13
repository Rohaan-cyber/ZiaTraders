const { getDb } = require("../db");
const { ObjectId } = require("mongodb");

let SaleOrder = function (data, userid) {
    this.data = data;
    this.userid = userid;
    this.errors = [];
};

function SaleOrderCollection() {
    return getDb().collection("SaleOrder");
}

function SupplierCollection() {
    return getDb().collection("customers");
}

function supplierLedgerCollection() {
    return getDb().collection("customerLedger");
}

function inventoryCollection() {
    return getDb().collection("inventory");
}

// Get the next order number
async function maxNumber() {
    const result = await SaleOrderCollection()
        .aggregate([{ $group: { _id: null, max: { $max: "$orderNo" } } }])
        .toArray();

    const max = result[0]?.max ?? 0;
    return max + 1;
}

// Get supplier name by ID
async function getSupplierNameById(supplierId) {
    if (!ObjectId.isValid(supplierId)) throw new Error("Invalid supplierId: " + supplierId);
    const supplier = await SupplierCollection().findOne({ _id: new ObjectId(supplierId) });
    return supplier ? supplier.custName : "";
}

// Get next orderNo
SaleOrder.prototype.GetorderNo = async function () {
    return await maxNumber();
};

// Validation (without inventory check)
SaleOrder.prototype.validate = async function () {
    this.errors = [];

    if (!this.data.customerDropdown || this.data.customerDropdown.trim() === "") {
        this.errors.push("Customer must be selected");
    }

    if (!this.data.ConKanWeight || this.data.ConKanWeight.trim() === "") {
        this.errors.push("Computer Kanta Weight must not be empty");
    }

    if (!this.data.rate || this.data.rate.trim() === "") {
        this.errors.push("Rate must not be empty");
    }
};

// Create Sale order (without inventory check)
SaleOrder.prototype.createSaleOrder = function () {
    return new Promise(async (resolve, reject) => {
        try {
            await this.validate();
            if (this.errors.length) return reject(this.errors.join(", "));

            const newOrderNo = await maxNumber();
            const supplierName = await getSupplierNameById(this.data.customerDropdown);

            // Prepare this.data for DB
            const dataForDb = {
                userid: this.userid,
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

                // Include commented-out fields (no default 0)
          //      bDanaKaat: this.data.bDanaKaat ? parseFloat(this.data.bDanaKaat) : undefined,
            //    KamWazanJurmana: this.data.KamWazanJurmana ? parseFloat(this.data.KamWazanJurmana) : undefined,
              //  KulDMG: this.data.KulDMG ? parseFloat(this.data.KulDMG) : undefined,
                // SafiDMG: this.data.SafiDMG ? parseFloat(this.data.SafiDMG) : undefined,
                // KulKachr: this.data.KulKachr ? parseFloat(this.data.KulKachr) : undefined,
                // SafiKachar: this.data.SafiKachar ? parseFloat(this.data.SafiKachar) : undefined,
               // KulNami: this.data.KulNami ? parseFloat(this.data.KulNami) : undefined,
            //    SafiNami: this.data.SafiNami ? parseFloat(this.data.SafiNami) : undefined,
              //  ManfiWazan: this.data.ManfiWazan ? parseFloat(this.data.ManfiWazan) : undefined,

                rate: parseFloat(this.data.rate),
                kameeRate: parseFloat(this.data.kameeRate),
                safiWazan: parseFloat(this.data.safiWazan || 0),
                karayaKanta: parseFloat(this.data.karayaKanta || 0),
                safiRate: parseFloat(this.data.safiRate || 0),
                munshiana: parseFloat(this.data.munshiana || 0),
                kulRaqm: parseFloat(this.data.kulRaqm || 0),
                Mazdoori: parseFloat(this.data.Mazdoori || 0),
                mazdooriRate: parseFloat(this.data.mazdooriRate || 0),
                safiRaqm: parseFloat(this.data.safiRaqm || 0),
                KharKunindaBroker: parseFloat(this.data.KharKunindaBroker || 0),
                kulSafiRaqm: parseFloat(this.data.kulSafiRaqm || 0)
            };

            // Update customer ledger
            const customer = await SupplierCollection().findOne({ custName: supplierName });
            const custPaydue = customer ? customer.custPayDue || 0 : 0;
            const total = custPaydue - (dataForDb.kulSafiRaqm || 0);

            await SupplierCollection().findOneAndUpdate(
                { custName: supplierName },
                { $set: { custPayDue: total } }
            );

            await supplierLedgerCollection().insertOne({
                Date: new Date(),
                CustomerName: supplierName,
                BillNumber: dataForDb.billNo,
                Debit: dataForDb.kulSafiRaqm || 0,
                Credit: 0,
                Details: "Order Number: " + dataForDb.orderNo,
                Remaining: total,
                authorId: new ObjectId(this.userid)
            });

            // Insert sale order (no inventory check)
            await SaleOrderCollection().insertOne(dataForDb);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

SaleOrder.prototype.FINDINVENTORY = async function() {
    const inventory = await inventoryCollection().findOne({ userid: this.userid });
    console.log("FINDINVENTORY query:", { userid: this.userid });
    console.log("Found inventory:", inventory);
    return inventory || { value: 0 };
};

module.exports = SaleOrder;
