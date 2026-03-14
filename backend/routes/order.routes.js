const express = require("express");
const {
  paymentIntent,
  addOrder,
  getOrders,
  updateOrderStatus,
  getSingleOrder,
} = require("../controller/order.controller");
const verifyToken = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");

const router = express.Router();

// Admin-only routes
router.get("/orders", verifyToken, authorization("admin", "manager", "staff"), getOrders);
router.patch("/update-status/:id", verifyToken, authorization("admin", "manager", "staff"), updateOrderStatus);

// Protected routes (any authenticated user)
router.get("/:id", verifyToken, getSingleOrder);
router.post("/create-payment-intent", verifyToken, paymentIntent);
router.post("/saveOrder", verifyToken, addOrder);

module.exports = router;
