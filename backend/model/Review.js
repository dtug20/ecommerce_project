const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    productId: {
      type: ObjectId,
      ref: "Products",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },

    // Extended review fields
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpful: {
      count: { type: Number, default: 0 },
      users: [{ type: ObjectId, ref: "User" }],
    },
    adminReply: {
      text: { type: String },
      repliedAt: { type: Date },
      repliedBy: { type: ObjectId, ref: "Admin" },
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ createdAt: -1 });

const Reviews = mongoose.model("Reviews", reviewSchema);
module.exports = Reviews;
