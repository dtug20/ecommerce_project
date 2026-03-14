const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const verifyToken = require("../middleware/verifyToken");

// get user profile (protected)
router.get("/me", verifyToken, userController.getProfile);

// update user profile (protected)
router.put("/update-user/:id", verifyToken, userController.updateUser);

module.exports = router;
