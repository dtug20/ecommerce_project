const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = mongoose.Schema(
  {
    keycloakId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minLength: [3, "Name must be at least 3 characters."],
      maxLength: [100, "Name is too large"],
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Provide a valid Email"],
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email address is required"],
    },
    password: {
      type: String,
      required: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "vendor"],
      default: "user",
    },

    contactNumber: {
      type: String,
      validate: [
        validator.isMobilePhone,
        "Please provide a valid contact number",
      ],
    },

    shippingAddress: String,

    imageURL: {
      type: String,
      validate: [validator.isURL, "Please provide a valid url"],
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    bio: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "blocked"],
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reviews" }],

    // Extended profile fields
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    emailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    confirmationToken: { type: String },
    confirmationTokenExpires: { type: Date },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    addresses: [
      {
        label: { type: String, default: "home" },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String },
        country: { type: String, required: true },
        zipCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],

    vendorProfile: {
      storeName: { type: String },
      storeSlug: { type: String },
      storeLogo: { type: String },
      storeBanner: { type: String },
      storeDescription: { type: String },
      commissionRate: { type: Number, default: 10 },
      bankInfo: { type: mongoose.Schema.Types.Mixed },
      verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended"],
        default: "pending",
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ "vendorProfile.storeSlug": 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
