const express = require('express');
const router = express.Router();
const userOrderController = require('../controller/user.order.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

// dashboard routes (admin/manager only)
router.get('/dashboard-amount', verifyToken, authorization("admin", "manager"), userOrderController.getDashboardAmount);
router.get('/sales-report', verifyToken, authorization("admin", "manager"), userOrderController.getSalesReport);
router.get('/most-selling-category', verifyToken, authorization("admin", "manager"), userOrderController.mostSellingCategory);
router.get('/dashboard-recent-order', verifyToken, authorization("admin", "manager"), userOrderController.getDashboardRecentOrder);

//get all order by a user (must be before /:id to avoid route conflict)
router.get('/', verifyToken, userOrderController.getOrderByUser);

//get a order by id (authenticated, with ownership check in controller)
router.get('/:id', verifyToken, userOrderController.getOrderById);

module.exports = router;
