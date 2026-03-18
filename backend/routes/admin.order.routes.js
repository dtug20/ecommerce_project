const router = require('express').Router();
const controller = require('../controller/admin.order.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

router.use(verifyToken, authorization('admin', 'manager', 'staff'));

router.get('/', controller.getAllOrders);
router.get('/stats', controller.getOrderStats);
router.get('/:id', controller.getOrderById);
router.post('/', controller.createOrder);
router.patch('/:id', controller.updateOrder);
router.patch('/:id/status', controller.updateOrderStatus);
router.delete('/:id', controller.deleteOrder);

module.exports = router;
