const CustLedger = require('../models/Customer-ledger')
const Customer = require('../models/Customers')
const Supplier = require('../models/Suppliers')
const { ObjectId } = require('mongodb').ObjectId
const SuppLedger = require('../models/Supplier-Payment')
let PurchaseOrder = require('../models/Purchase-Order')

let customers

exports.Dashboard = async (req, res) => {
    try {
        let customer = new Customer({}, req.session.user.id)
        let customersLength = await customer.findCustomersLength()

        let supplier = new Supplier({}, req.session.user.id)
        let suppliersLength = await supplier.findSupplierLength()
        let supPayableAmount = await supplier.findSupplierAmount()
        let custRecieveAmount = await customer.findCustomerAmount()

        // ✅ Pass both args: (legdata={}, userid)
        let custledger = new CustLedger({}, req.session.user.id)
        let suppledger = new SuppLedger({}, req.session.user.id)
        let CustTransactions = await custledger.findTransactionById()
        let SuppTransactions = await suppledger.SuppfindTransactionById()

        // TODO: add suppledger in same way later
        const recentCustTransactions = CustTransactions
        const recentSuppTransactions = SuppTransactions

        res.render("dashboard", {
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            totalCustomers: customersLength,
            totalSuppliers: suppliersLength,
            supPayable: supPayableAmount,
            totalReceivable: custRecieveAmount,
            recentCustTransactions,
            recentSuppTransactions,
            activePage: "dashboard"
        })
    } catch (err) {
        console.error("Dashboard error:", err)
        res.render("dashboard", {
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            totalCustomers: 0,
            totalSuppliers: 0,
            supPayable: 0,
            totalReceivable: 0,
            recentCustTransactions: [],
            recentSuppTransactions: [],
            activePage: "dashboard"
        })
    }
}


exports.deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id
        const userId = req.session.user.id  // make sure only owner can delete
        const customer = await Customer.DeleteCustomer(customerId, userId)
        
        req.flash("success_msg", "Customer deleted successfully")
        res.redirect("/customers")
    } catch (err) {
        console.error(err)
        req.flash("error_msg", "Failed to delete customer")
        res.redirect("/customers")
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        const supplierId = req.params.id
        const suppId = req.session.user.id  // make sure only owner can delete

        const supplier = await Supplier.DeleteSupplier(supplierId, suppId)
        req.flash("success_msg", "Supplier deleted successfully")
        res.redirect("/suppliers")
    } catch (err) {
        console.error(err)
        req.flash("error_msg", "Failed to delete Supplier")
        res.redirect("/suppliers")
    }
}

exports.customer = async (req, res) => {
    try {
        let customer = new Customer({}, req.session.user.id)  // <-- pass user id
        customers = await customer.findCustomers()  // fetch only this user's customers

    
        res.render("customers", {
            user: req.session.user,
            customers, // DB customers for this user
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "customers"
        })
    } catch (err) {
        console.error(err)
        req.flash("error_msg", "Failed to load customers")
        res.render("customers", {
            user: req.session.user,
            customers: [],
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "customers"
        })
    }
}

exports.suppliers = async (req, res) => {
    try {
        let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
        let suppliers = await supplier.findSupplier()  // fetch only this user's customers

        res.render("suppliers", {
            user: req.session.user,
            suppliers, // DB customers for this user
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "suppliers"
        })
    } catch {
        req.flash("error_msg", "Failed to load customers")
        res.render("suppliers", {
            user: req.session.user,
            customers: [],
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "suppliers"
        })
    }

}

exports.transactions = (req, res) => {
    res.render("transactions", {
        user: req.session.user,
        transactions: [
            { customer: "Ali", date: "2025-08-27", amount: 250, status: "Paid" },
            { customer: "Sara", date: "2025-08-26", amount: 150, status: "Pending" }
        ],
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "transactions" // <-- add this
    });
}

exports.reports = (req, res) => {
    res.render("reports", {
        user: req.session.user,
        reports: [
            { type: "Revenue", value: 3500 },
            { type: "Pending Payments", value: 1200 },
            { type: "New Customers", value: 10 }
        ],
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "reports" 
    });
}

exports.settings = (req, res) => {
    res.render("settings", {
        user: req.session.user,
        settings: { theme: "dark", notifications: true },
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "settings" //  add this
    });
}

// Database
exports.createCustomer = async (req, res) => {
    console.log("REQ.BODY:", req.body)
    try {
        let customer = new Customer(req.body, req.session.user.id)
        const savedCustomer = await customer.addCustomer()
        res.json({ success: true, customer: savedCustomer })
    } catch (err) {
        console.log("ERROR:", err)
        res.json({ success: false, errors: err.errors || ["Failed to add customer"] })
    }
}


exports.createSupplier = async (req, res) => {
    try {
        let supplier = new Supplier(req.body, req.session.user.id)
        const savedSupplier = await supplier.addSupplier()

        // respond with JSON for frontend
        res.json({ success: true, supplier: savedSupplier })
    } catch (err) {
        res.json({ success: false, errors: err })
    }
}


exports.payments = async (req, res) => {
    res.render('Payment', {
        user: req.session.user,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "payments" 
    })
}


exports.CustomerPayment = async (req, res) => {
    let customer = new Customer({}, req.session.user.id)  // <-- pass user id
    customers = await customer.findCustomers()  // fetch only this user's customers
    res.render('Customer-Payment-Page', {
        user: req.session.user,
        customers,
        customerPayDue: customer.custPayDue,
        TodayDate: new Date(),
    })
}

exports.SupplierPayment = async (req, res) => {
    let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
    let suppliers = await supplier.findSupplier()  // fetch only this user's customers
    res.render('Supplier-Payment-Page', {
        user: req.session.user,
        suppliers,
        TodayDate: new Date(),
    })
}

exports.createCustomerLedger = function (req, res) {
    console.log("REQ BODY:", req.body)

    // ✅ Fix: pass req.session.user.id
    let custledger = new CustLedger(req.body, req.session.user.id)
    custledger.createCustLedger().then(() => {
        res.redirect('/payments')
    }).catch((err) => {
        res.send(err)
    })
}

exports.createSupplierLedger = function (req, res) {
    console.log("REQ BODY:", req.body)

    // ✅ Same fix for suppliers later
    let suppledger = new SuppLedger(req.body, req.session.user.id)
    suppledger.createSuppLedger().then(() => {
        res.redirect('/payments')
    }).catch((err) => {
        res.send(err)
    })
}

exports.customerTransaction = async function (req, res) {
    let customer = new Customer({}, req.session.user.id)  // <-- pass user id
    customers = await customer.findCustomers()  // fetch only this user's customers
    let custledger = new CustLedger(req.body)
    res.render('customer-Transactions', {
        user: req.session.user,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "payments" ,
        customers,
        customerTransactions: []
    })
}

exports.supplierTransaction = async function (req, res) {
    let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
    let suppliers = await supplier.findSupplier()  // fetch only this user's customers
    let suppledger = new SuppLedger(req.body)
    res.render('supplier-Transactions', {
        user: req.session.user,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "payments",
        suppliers,
        supplierTransactions: []
    })
}

exports.createCustTransaction = async function (req, res) {
    try {
        let customer = new Customer({}, req.session.user.id)  // <-- pass user id
        customers = await customer.findCustomers()  // fetch only this user's customers
        let custledger = new CustLedger(req.body, req.session.user.id)
        let customerTransactions = await custledger.createCustomerTran()
        res.render('customer-Transactions', {
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "payments",
            customers,
            customerTransactions,

        })
        console.log(customerTransactions[0].customerName)
    } catch (err) {
        console.log("No transactions or error:", err)
        res.send("Nothing!")
    }
}


exports.createSuppTransaction = async function (req, res) {
    try {
        let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
        let suppliers = await supplier.findSupplier()  // fetch only this user's customers
        let suppledger = new SuppLedger(req.body, req.session.user.id)
        let supplierTransactions = await suppledger.createSuppTran()
        res.render('supplier-Transactions', {
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "payments",
            suppliers,
            supplierTransactions,

        })
    } catch (err) {
        console.log("No transactions or error:", err)
        res.send("Nothing!")
    }
}


exports.PurchaseOrder = async function (req, res) {
    let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
    let suppliers = await supplier.findSupplier()  // fetch only this user's customers
    let purchaseOrder = new PurchaseOrder()
    let orderNo = await purchaseOrder.GetorderNo()
    res.render('purchase-order', {
        user: req.session.user,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "Purchase-Order",
        suppliers,
        orderNo,
        TodayDate: new Date()
    })
}

exports.CreatePurchaseOrder = async function (req, res) {
    let purchaseOrder = new PurchaseOrder(req.body);
    try {
        let PurChaseOrder = await purchaseOrder.createpurchaseOrder();
        req.flash("success_msg", PurChaseOrder);
        res.redirect("/purchase-order-page");  // go back to the form page
    } catch (errors) {
        // errors could be array of strings
        req.flash("error_msg", Array.isArray(errors) ? errors.join(", ") : errors);
        res.redirect("/purchase-order-page");  // back to form
    }
};

