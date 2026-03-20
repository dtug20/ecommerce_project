const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/vendorController');

router.use(attachProxy);

// Stats must come before /:id
router.get('/stats', ctrl.getVendorStats);

router.get('/', ctrl.listVendors);
router.get('/:id', ctrl.getVendor);
router.get('/:id/products', ctrl.getVendorProducts);
router.get('/:id/orders', ctrl.getVendorOrders);
router.get('/:id/payouts', ctrl.getVendorPayouts);

router.patch('/:id/approve', ctrl.approveVendor);
router.patch('/:id/reject', ctrl.rejectVendor);
router.patch('/:id/suspend', ctrl.suspendVendor);
router.patch('/:id/commission', ctrl.updateCommission);

router.post('/:id/payouts/:payoutId/process', ctrl.processPayout);

module.exports = router;
