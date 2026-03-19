const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: false
    },
    endTime: {
      type: Date,
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
    },
    minimumAmount: {
      type: Number,
      required: true,
    },
    productType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    // Extended coupon fields
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        usedAt: { type: Date, required: true },
      },
    ],
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    ],
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
    excludedProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    ],
    displayRules: {
      showOnBanner: { type: Boolean, default: false },
      showOnCheckout: { type: Boolean, default: true },
      showOnProductPage: { type: Boolean, default: false },
      targetPages: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ "usedBy.userId": 1 });
couponSchema.index({ applicableCategories: 1 }, { sparse: true });
couponSchema.index({ applicableProducts: 1 }, { sparse: true });

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
