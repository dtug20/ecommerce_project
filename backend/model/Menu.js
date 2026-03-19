const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Please provide a menu item label"],
    },
    labelVi: {
      type: String,
    },
    type: {
      type: String,
      required: [true, "Please provide a menu item type"],
      enum: ["link", "page", "category", "product", "custom"],
    },
    url: {
      type: String,
    },
    target: {
      type: String,
      enum: ["_self", "_blank"],
      default: "_self",
    },
    reference: {
      model: {
        type: String,
        enum: ["Page", "Category", "Product"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    icon: {
      type: String,
    },
    image: {
      type: String,
    },
    children: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a menu name"],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Please provide a menu slug"],
      unique: true,
    },
    location: {
      type: String,
      required: [true, "Please provide a menu location"],
      enum: [
        "header-main",
        "header-top",
        "footer-main",
        "footer-secondary",
        "mobile-nav",
      ],
    },
    items: [menuItemSchema],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

menuSchema.index({ name: 1 }, { unique: true });
menuSchema.index({ slug: 1 }, { unique: true });
menuSchema.index({ location: 1 });
menuSchema.index({ status: 1 });
menuSchema.index({ location: 1, isDefault: 1 });

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
