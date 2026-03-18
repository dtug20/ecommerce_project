const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");
const { addReview, deleteReviews} = require("../controller/review.controller");

// add a review (authenticated users only)
router.post("/add", verifyToken, addReview);
// delete reviews (admin only)
router.delete("/delete/:id", verifyToken, authorization("admin", "manager"), deleteReviews);

module.exports = router;
