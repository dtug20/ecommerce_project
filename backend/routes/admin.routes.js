const express = require("express");
const router = express.Router();
const {
  addStaff,
  getAllStaff,
  deleteStaff,
  getStaffById,
  updateStaff,
  updatedStatus,
} = require("../controller/admin.controller");
const verifyToken = require("../middleware/verifyToken");
const authorization = require("../middleware/authorization");

// All admin routes require authentication + admin/manager role
router.use(verifyToken);
router.use(authorization("admin", "manager"));

// add a staff member (creates in Keycloak + MongoDB)
router.post("/add", addStaff);

// get all staff
router.get("/all", getAllStaff);

// get a staff by id
router.get("/get/:id", getStaffById);

// update a staff
router.patch("/update-stuff/:id", updateStaff);

// update staff status
router.patch("/update-status/:id", updatedStatus);

// delete a staff
router.delete("/:id", deleteStaff);

module.exports = router;
