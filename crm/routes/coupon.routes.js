const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const attachProxy = require('../middleware/attachProxy');

router.use(attachProxy);

router.get('/', couponController.listCoupons);
router.get('/:id', couponController.getCoupon);
router.post('/', couponController.createCoupon);
router.patch('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
