const CustLedger = require('../models/Customer-ledger')
const Customer = require('../models/Customers')
const Supplier = require('../models/Suppliers')
const  ObjectId  = require('mongodb').ObjectId
const SuppLedger = require('../models/Supplier-Payment')
let PurchaseOrder = require('../models/Purchase-Order')
let SaleOrder = require('../models/Sale-Order')
let User = require('../models/User')

let customers

exports.Dashboard = async (req, res) => {
    try {
        let customer = new Customer({}, req.session.user.id)
        let customersLength = await customer.findCustomersLength()

        let supplier = new Supplier({}, req.session.user.id)
     // Wait for the async function to finish before formatting
let suppliersLengthRaw = await supplier.findSupplierLength();
let suppliersLength = suppliersLengthRaw || 0;

let supPayableRaw = await supplier.findSupplierAmount();
let supPayableAmount = supPayableRaw || 0;

let custRecieveRaw = await customer.findCustomerAmount();
let custRecieveAmount = custRecieveRaw || 0;


        // ✅ Pass both args: (legdata={}, userid)
        let custledger = new CustLedger({}, req.session.user.id)
        let suppledger = new SuppLedger({}, req.session.user.id)
        let CustTransactions = await custledger.findTransactionById()
        let SuppTransactions = await suppledger.SuppfindTransactionById()

        // TODO: add suppledger in same way later
        const recentCustTransactions = CustTransactions
        const recentSuppTransactions = SuppTransactions

           let user = new User({}, req.session.user.id)
let inventoryData = await user.findInventory();  // inventoryData is either {commodity, value} or 0
let inventoryValue = 0;

if (inventoryData && inventoryData.value !== undefined) {
    inventoryValue = inventoryData.value;
}

        let bajaraData = await user.findInventoryBajara()
        let inventoryBajara = 0;

        if (bajaraData && bajaraData.value !== undefined) {
    inventoryBajara = bajaraData.value;
}
        res.render("dashboard", {
            user: req.session.user,
            shopName: req.session.user.ShopName,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            totalCustomers: customersLength,
            totalSuppliers: suppliersLength,
            supPayable: supPayableAmount,
            totalReceivable: custRecieveAmount,
            recentCustTransactions,
            recentSuppTransactions,
            inventory: inventoryValue,
            bajara: inventoryBajara,
            activePage: "dashboard"
        })
    } catch (err) {
        console.error("Dashboard error:", err)
        res.render("dashboard", {
            user: req.session.user,
                shopName: req.session.user.ShopName,
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
              shopName: req.session.user.ShopName,
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
             shopName: req.session.user.ShopName,
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
                 shopName: req.session.user.ShopName,
            suppliers, // DB customers for this user
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "suppliers"
        })
    } catch {
        req.flash("error_msg", "Failed to load customers")
        res.render("suppliers", {
            user: req.session.user,
                 shopName: req.session.shopName,
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
              shopName: req.session.user.ShopName,
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
                shopName: req.session.user.ShopName,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "reports" 
    });
}

exports.settings = (req, res) => {
    res.render("settings", {
        user: req.session.user,
                 shopName: req.session.user.ShopName,
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
        shopName: req.session.user.ShopName,
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
             shopName: req.session.user.ShopName,
        customers,
        customerPayDue: customer.custPayDue,
        TodayDate: new Date(),
    })
}

exports.SupplierPayment = async (req, res) => {
    let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
    let suppliers = await supplier.findSupplier()  // fetch only this user's customers

      const db = require("../db").getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(req.session.user.id) });

    // Extract bank names (exclude reserved fields)
    const reserved = ["_id", "username", "password", "ShopName", "cash", "isAdmin", "serialNumber"];
    const bankNames = Object.keys(userDoc).filter(k => !reserved.includes(k));
    
    res.render('Supplier-Payment-Page', {
     shopName: req.session.user.ShopName,
        user: req.session.user,
        suppliers,
        TodayDate: new Date(),
        bankNames
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
     shopName: req.session.user.ShopName,
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
        shopName: req.session.user.ShopName,
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
           shopName: req.session.user.ShopName,
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "payments",
            customers,
            customerTransactions,

        })
        console.log(customerTransactions[0].customerName)
    } catch (err) {
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
                shopName: req.session.user.ShopName,
            user: req.session.user,
            success_msg: req.flash("success_msg"),
            error_msg: req.flash("error_msg"),
            activePage: "payments",
            suppliers,
            supplierTransactions,

        })
    } catch (err) {
        res.send("Nothing!")
    }
}

exports.SaleOrder = async function(req, res) {
    let customer = new Customer({}, req.session.user.id);  // pass user id
    let customers = await customer.findCustomers();       // fetch this user's customers

    let saleOrder = new SaleOrder({}, req.session.user.id); // pass user id here too
    let orderNo = await saleOrder.GetorderNo();
    let Inventory = await saleOrder.FINDINVENTORY();

    res.render('sale-order', {
        user: req.session.user,
        shopName: req.session.user.ShopName,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "Sale-Order",
        customers,
        orderNo,
        Inventory,
        TodayDate: new Date()
    });
}


exports.PurchaseOrder = async function (req, res) {
    let supplier = new Supplier({}, req.session.user.id)  // <-- pass user id
    let suppliers = await supplier.findSupplier()  // fetch only this user's customers
    let purchaseOrder = new PurchaseOrder()
    let orderNo = await purchaseOrder.GetorderNo()
    res.render('purchase-order', {
        user: req.session.user,
      shopName: req.session.user.ShopName,
        success_msg: req.flash("success_msg"),
        error_msg: req.flash("error_msg"),
        activePage: "Purchase-Order",
        suppliers,
        orderNo,
        TodayDate: new Date()
    })
}

exports.CreateSaleOrder = async function (req, res) {
    let saleOrder = new SaleOrder(req.body, req.session.user.id);
    try {
        let SALEOrder = await saleOrder.createSaleOrder();
        req.flash("success_msg", "Successfully created sale order");
        res.redirect("/sales-order-page");  // go back to the form page
    } catch (errors) {
        // errors could be array of strings
            console.error("Create Sale Order error:", errors); // log DB error
        req.flash("error_msg", Array.isArray(errors) ? errors.join(", ") : errors);
        res.redirect("/sales-order-page");  // back to form
    }
};


exports.CreatePurchaseOrder = async function (req, res) {
       let purchaseOrder = new PurchaseOrder(req.body, req.session.user.id);
    try {
        let PurChaseOrder = await purchaseOrder.createpurchaseOrder();
        req.flash("success_msg", "Purchase order created successfully");
        res.redirect("/purchase-order-page");  // go back to the form page
    } catch (errors) {
        // errors could be array of strings
        req.flash("error_msg", Array.isArray(errors) ? errors.join(", ") : errors);
        res.redirect("/purchase-order-page");  // back to form
    }
};








