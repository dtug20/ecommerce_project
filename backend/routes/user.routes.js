const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const verifyToken = require("../middleware/verifyToken");

// get user profile (protected)
router.get("/me", verifyToken, userController.getProfile);

// update user profile (protected — uses req.user._id, no :id param needed)
router.put("/update-user", verifyToken, userController.updateUser);
// keep legacy route for backward compat (still uses req.user._id internally)
router.put("/update-user/:id", verifyToken, userController.updateUser);

module.exports = router;
