const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const sidebarController = require('./controllers/sidebar-controller')
const requireLogin = require("./middleware/auth");

router.get("/", userController.home);

// Dashboard (Home route)
router.get("/dashboard", requireLogin, sidebarController.Dashboard);

// purchase Order
router.get('/purchase-order-page', requireLogin, sidebarController.PurchaseOrder)
router.post('/Purchase-Order', requireLogin, sidebarController.CreatePurchaseOrder)
// sale order
router.get('/sales-order-page', requireLogin, sidebarController.SaleOrder)
router.post('/Sale-Order', requireLogin, sidebarController.CreateSaleOrder)
// delete customer
router.post("/customers/delete/:id", requireLogin, sidebarController.deleteCustomer)
router.post("/suppliers/delete/:id", requireLogin, sidebarController.deleteSupplier)

// Customers page
router.get("/customers", requireLogin, sidebarController.customer);
router.post('/create-customer', requireLogin, sidebarController.createCustomer)
router.get('/Customer-Payment', requireLogin, sidebarController.CustomerPayment)

// Transactions page
router.get("/transactions", requireLogin, sidebarController.transactions);
router.get('/customer-transaction', requireLogin, sidebarController.customerTransaction)
router.post('/transaction-customer', requireLogin, sidebarController.createCustTransaction)
router.get('/supplier-transaction', requireLogin, sidebarController.supplierTransaction)
// payments page
router.get('/payments', requireLogin, sidebarController.payments)
router.post('/createCustLedger', requireLogin, sidebarController.createCustomerLedger)
router.get('/Supplier-Payment', requireLogin, sidebarController.SupplierPayment)
router.post('/createSuppLedger', requireLogin, sidebarController.createSupplierLedger)
router.post('/transaction-supplier', requireLogin, sidebarController.createSuppTransaction)

// Reports page
router.get("/reports", requireLogin, sidebarController.reports);

// Settings page
router.get("/settings", requireLogin, sidebarController.settings);
// suppliers page
router.get('/suppliers', requireLogin, sidebarController.suppliers)
router.post('/create-supplier', requireLogin, sidebarController.createSupplier)

// Auth routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);


module.exports = router;



