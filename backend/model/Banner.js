const mongoose = require("mongoose");

const bannerContentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },
    textVi: {
      type: String,
    },
    buttonText: {
      type: String,
    },
    buttonTextVi: {
      type: String,
    },
    buttonUrl: {
      type: String,
    },
    image: {
      type: String,
    },
    imageMobile: {
      type: String,
    },
    backgroundColor: {
      type: String,
    },
    textColor: {
      type: String,
    },
  },
  { _id: false }
);

const schedulingSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isAlwaysActive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const targetingSchema = new mongoose.Schema(
  {
    pages: {
      type: [String],
      default: [],
    },
    userSegments: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema(
  {
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    dismissals: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a banner title"],
    },
    type: {
      type: String,
      required: [true, "Please provide a banner type"],
      enum: [
        "announcement-bar",
        "popup",
        "hero-slide",
        "promotional-banner",
        "category-banner",
      ],
    },
    content: {
      type: bannerContentSchema,
      default: () => ({}),
    },
    scheduling: {
      type: schedulingSchema,
      default: () => ({}),
    },
    targeting: {
      type: targetingSchema,
      default: () => ({}),
    },
    position: {
      type: String,
      enum: ["top", "bottom", "modal", "inline"],
    },
    priority: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "scheduled"],
      default: "inactive",
    },
    dismissible: {
      type: Boolean,
      default: true,
    },
    analytics: {
      type: analyticsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ type: 1 });
bannerSchema.index({ status: 1 });
bannerSchema.index({ priority: -1 });
bannerSchema.index({ "scheduling.startDate": 1 });
bannerSchema.index({ "scheduling.endDate": 1 });
bannerSchema.index({ "targeting.pages": 1 });

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
