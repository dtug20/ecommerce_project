const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema(
  {
    blockType: {
      type: String,
      required: [true, "Please provide a block type"],
      enum: [
        "hero-slider",
        "featured-products",
        "category-showcase",
        "banner-grid",
        "promo-section",
        "testimonials",
        "newsletter",
        "custom-html",
        "product-carousel",
        "brand-showcase",
        "countdown-deal",
        "text-block",
        "image-gallery",
        "video-section",
      ],
    },
    title: {
      type: String,
    },
    subtitle: {
      type: String,
    },
    order: {
      type: Number,
      required: [true, "Please provide a block order"],
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    visibleFrom: {
      type: Date,
    },
    visibleUntil: {
      type: Date,
    },
  },
  { _id: true }
);

const pageSeoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    ogImage: {
      type: String,
    },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a page title"],
    },
    slug: {
      type: String,
      required: [true, "Please provide a page slug"],
      unique: true,
    },
    type: {
      type: String,
      required: [true, "Please provide a page type"],
      enum: ["home", "landing", "custom"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    blocks: [contentBlockSchema],
    seo: {
      type: pageSeoSchema,
      default: () => ({}),
    },
    publishedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

pageSchema.index({ slug: 1 }, { unique: true });
pageSchema.index({ type: 1 });
pageSchema.index({ status: 1 });
pageSchema.index({ createdBy: 1 });
pageSchema.index({ publishedAt: -1 });

const Page = mongoose.model("Page", pageSchema);

module.exports = Page;
