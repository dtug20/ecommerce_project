const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/analyticsController');

router.use(attachProxy);

router.get('/', ctrl.getDashboard);
router.get('/revenue', ctrl.getRevenue);
router.get('/top-products', ctrl.getTopProducts);
router.get('/customer-growth', ctrl.getCustomerGrowth);
router.get('/recent-orders', ctrl.getRecentOrders);

module.exports = router;
