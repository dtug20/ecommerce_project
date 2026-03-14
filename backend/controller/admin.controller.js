const Admin = require("../model/Admin");
const keycloakService = require("../services/keycloak.service");

// Map Admin model role to Keycloak realm role
const ROLE_MAP = {
  Admin: "admin",
  "Super Admin": "admin",
  Manager: "manager",
  CEO: "manager",
};

// POST /api/admin/add — create staff in Keycloak + MongoDB
const addStaff = async (req, res, next) => {
  try {
    const isAdded = await Admin.findOne({ email: req.body.email });
    if (isAdded) {
      return res.status(500).send({ message: "This Email already Added!" });
    }

    // Create user in Keycloak
    const keycloakUserId = await keycloakService.createUser({
      username: req.body.email,
      email: req.body.email,
      firstName: req.body.name,
      enabled: true,
      emailVerified: true,
      requiredActions: ["UPDATE_PASSWORD"],
    });

    // Assign realm role
    const keycloakRole = ROLE_MAP[req.body.role] || "staff";
    await keycloakService.assignRealmRole(keycloakUserId, keycloakRole);

    // Set temporary password if provided
    if (req.body.password) {
      await keycloakService.resetUserPassword(
        keycloakUserId,
        req.body.password,
        true
      );
    }

    // Store supplementary data in MongoDB
    const newStaff = new Admin({
      keycloakId: keycloakUserId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      joiningDate: req.body.joiningDate,
      role: req.body.role,
      image: req.body.image,
    });
    await newStaff.save();

    res.status(200).send({ message: "Staff Added Successfully!" });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/all
const getAllStaff = async (req, res, next) => {
  try {
    const admins = await Admin.find({}).sort({ _id: -1 });
    res.status(200).json({
      status: true,
      message: "Staff get successfully",
      data: admins,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/get/:id
const getStaffById = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    res.send(admin);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/update-stuff/:id — update in Keycloak + MongoDB
const updateStaff = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id });
    if (!admin) {
      return res.status(404).send({ message: "This Staff not found!" });
    }

    // Update Keycloak user if keycloakId exists
    if (admin.keycloakId) {
      await keycloakService.updateUser(admin.keycloakId, {
        firstName: req.body.name,
        email: req.body.email,
      });

      if (req.body.status === "Inactive") {
        await keycloakService.setUserEnabled(admin.keycloakId, false);
      } else if (req.body.status === "Active") {
        await keycloakService.setUserEnabled(admin.keycloakId, true);
      }
    }

    // Update MongoDB
    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;
    admin.phone = req.body.phone || admin.phone;
    admin.role = req.body.role || admin.role;
    admin.joiningDate = req.body.joiningDate || admin.joiningDate;
    admin.image = req.body.image || admin.image;
    admin.status = req.body.status || admin.status;

    const updatedAdmin = await admin.save();
    res.send({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      image: updatedAdmin.image,
      phone: updatedAdmin.phone,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/:id — delete from Keycloak + MongoDB
const deleteStaff = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (admin?.keycloakId) {
      try {
        await keycloakService.deleteUser(admin.keycloakId);
      } catch (kcErr) {
        console.error(
          `[Admin] Failed to delete Keycloak user: ${kcErr.message}`
        );
      }
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Admin Deleted Successfully" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/update-status/:id
const updatedStatus = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).send({ message: "Staff not found!" });
    }

    const newStatus = req.body.status;

    // Sync enabled/disabled state to Keycloak
    if (admin.keycloakId) {
      await keycloakService.setUserEnabled(
        admin.keycloakId,
        newStatus === "Active"
      );
    }

    await Admin.updateOne(
      { _id: req.params.id },
      { $set: { status: newStatus } }
    );

    res.send({ message: `Store ${newStatus} Successfully!` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  updatedStatus,
};
