const { getDb } = require("../db");
const { ObjectId } = require("mongodb");

let SaleOrder = function (data, userid) {
    this.data = data;
    this.userid = userid
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

function inventoryCollection() {
    return getDb().collection("inventory")
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


// Create Sale order
SaleOrder.prototype.createSaleOrder = function () {
    return new Promise(async (resolve, reject) => {
        try {
            await this.validate();
            if (this.errors.length) return reject(this.errors.join(", "));

            const newOrderNo = await maxNumber();
            const supplierName = await getSupplierNameById(this.data.customerDropdown);

            // Destructure original this.data safely
            const {
                billNo,
                orderDate,
                customerDropdown,
                truckNumber,
                commodity,
                ConKanWeight,
                tadad,
                bKanKaat,
                // bdanaKaat,
                // kamWazJarmana,
                rate,
                kameeRate,
                // kulDmg,
                // safiDmg,
                // kulKachr,
                // safiKachar,
                // kulNami,
                // safiNami,
                // manfiWazan,
                safiWazan,
                karayaKanta,
                safiRate,
                munshiana,
                kulRaqm,
                mazdoori,
                mazdooriRate,
                safiRaqm,
                KharKunindaBroker,
                kulSafiRaqm
            } = this.data;

            // Reassign this.data safely
            this.data = {
                userid: this.userid,
                orderNo: newOrderNo,
                billNo: billNo,
                Date: new Date(orderDate),
                customerId: new ObjectId(customerDropdown),
                customerName: supplierName,
                truckNumber: truckNumber,
                commodity: commodity,
                ConKanWeight: parseFloat(ConKanWeight),
                tadad: parseFloat(tadad),
                bKanKaat: parseFloat(bKanKaat),
                // bdanaKaat: parseFloat(bdanaKaat),
                // kamWazJarmana: parseFloat(kamWazJarmana),
                rate: parseFloat(rate),
                kameeRate: parseFloat(kameeRate),
                // kulDmg: parseFloat(kulDmg),
                // safiDmg: parseFloat(safiDmg),
                // kulKachr: parseFloat(kulKachr),
                // safiKachar: parseFloat(safiKachar),
                // kulNami: parseFloat(kulNami),
                // safiNami: parseFloat(safiNami),
                // manfiWazan: parseFloat(manfiWazan),
                safiWazan: parseFloat(safiWazan),
                karayaKanta: parseFloat(karayaKanta),
                safiRate: parseFloat(safiRate),
                munshiana: parseFloat(munshiana),
                kulRaqm: parseFloat(kulRaqm),
                Mazdoori: parseFloat(mazdoori),
                mazdooriRate: parseFloat(mazdooriRate),
                safiRaqm: parseFloat(safiRaqm),
                KharKunindaBroker: parseFloat(KharKunindaBroker),
                kulSafiRaqm: parseFloat(kulSafiRaqm),
            };

            // Update customer ledger and pay due
            let customer = await SupplierCollection().findOne({ custName: supplierName });
            let custPaydue = customer ? customer.custPayDue || 0 : 0;
            let total = custPaydue - this.data.kulSafiRaqm;

            await SupplierCollection().findOneAndUpdate(
                { custName: supplierName },
                { $set: { custPayDue: total } }
            );

            await supplierLedgerCollection().insertOne({
                Date: new Date(),
                CustomerName: supplierName,
                BillNumber: this.data.billNo,
                Debit: this.data.kulSafiRaqm,
                Credit: 0,
                Details: "Order Number: " + this.data.orderNo,
                Remaining: total,
                authorId: new ObjectId(this.userid)
            });

            // Insert sale order
            await SaleOrderCollection().insertOne(this.data);

            // ✅ Inventory decrement
            const Currentinv = await inventoryCollection().findOne({ userid: new ObjectId(this.userid) });
            const currentValue = Currentinv ? Currentinv.value : 0;

            if (currentValue >= this.data.tadad) {
                const result = await inventoryCollection().findOneAndUpdate(
                    { userid: new ObjectId(this.userid) },
                    { $inc: { value: -this.data.tadad } },
                    { upsert: true, returnDocument: "after" }
                );

                console.log("Updated Inventory:", result.value.value);
            } else {
                return reject("Not enough inventory");
            }

            resolve();
        } catch (err) {
            reject(err);
        }
    });
};


module.exports = SaleOrder;
