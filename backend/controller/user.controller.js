const User = require("../model/User");

// GET /api/user/me — get or create user profile from Keycloak token
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ keycloakId: req.user.keycloakId });

    if (!user) {
      const newUser = await User.create({
        name: req.user.name,
        email: req.user.email,
        keycloakId: req.user.keycloakId,
        role: req.user.role,
        status: "active",
      });
      return res.status(200).json({
        status: "success",
        data: { user: newUser },
      });
    }

    const { password, ...userData } = user.toObject();
    res.status(200).json({
      status: "success",
      data: { user: userData },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/user/update-user/:id — update business profile data
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.bio = req.body.bio || user.bio;
      user.imageURL = req.body.imageURL || user.imageURL;
      user.contactNumber = req.body.contactNumber || user.contactNumber;
      user.shippingAddress = req.body.shippingAddress || user.shippingAddress;
      const updatedUser = await user.save();
      const { password, ...userData } = updatedUser.toObject();
      res.status(200).json({
        status: "success",
        message: "Successfully updated profile",
        data: { user: userData },
      });
    } else {
      res.status(404).json({
        status: "fail",
        error: "User not found",
      });
    }
  } catch (error) {
    next(error);
  }
};
