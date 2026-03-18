const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');
const {
  addCoupon,
  addAllCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require('../controller/coupon.controller');

//add a coupon
router.post('/add', verifyToken, authorization("admin", "manager"), addCoupon);

//add multiple coupon
router.post('/all', verifyToken, authorization("admin", "manager"), addAllCoupon);

//get all coupon
router.get('/', getAllCoupons);

//get a coupon
router.get('/:id', getCouponById);

//update a coupon
router.patch('/:id', verifyToken, authorization("admin", "manager"), updateCoupon);

//delete a coupon
router.delete('/:id', verifyToken, authorization("admin", "manager"), deleteCoupon);

module.exports = router;
