const mongoose = require("mongoose");

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    primaryColor: {
      type: String,
      default: "#0989FF",
    },
    secondaryColor: {
      type: String,
      default: "#821F40",
    },
    accentColor: {
      type: String,
      default: "#F57F17",
    },
    fontFamily: {
      type: String,
      default: "Jost",
    },
    headerStyle: {
      type: String,
      enum: ["default", "transparent", "colored", "minimal"],
      default: "default",
    },
    footerStyle: {
      type: String,
      enum: ["default", "minimal", "dark", "light"],
      default: "default",
    },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    socialLinks: [socialLinkSchema],
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    freeShippingThreshold: {
      type: Number,
      default: 0,
    },
    defaultShippingCost: {
      type: Number,
      default: 0,
    },
    enabledMethods: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    enabledGateways: {
      type: [String],
      default: ["stripe", "cod"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    currencySymbol: {
      type: String,
      default: "$",
    },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    defaultTitle: {
      type: String,
    },
    defaultDescription: {
      type: String,
    },
    defaultKeywords: {
      type: [String],
      default: [],
    },
    googleAnalyticsId: {
      type: String,
    },
    facebookPixelId: {
      type: String,
    },
  },
  { _id: false }
);

const maintenanceSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
    },
  },
  { _id: false }
);

const i18nSchema = new mongoose.Schema(
  {
    defaultLanguage: {
      type: String,
      default: "en",
    },
    supportedLanguages: {
      type: [String],
      default: ["en", "vi"],
    },
  },
  { _id: false }
);

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: [true, "Please provide a site name"],
      default: "Shofy",
    },
    siteDescription: {
      type: String,
    },
    logo: {
      type: String,
    },
    favicon: {
      type: String,
    },
    ogImage: {
      type: String,
    },
    theme: {
      type: themeSchema,
      default: () => ({}),
    },
    contact: {
      type: contactSchema,
      default: () => ({}),
    },
    shipping: {
      type: shippingSchema,
      default: () => ({}),
    },
    payment: {
      type: paymentSchema,
      default: () => ({}),
    },
    seo: {
      type: seoSchema,
      default: () => ({}),
    },
    maintenance: {
      type: maintenanceSchema,
      default: () => ({}),
    },
    i18n: {
      type: i18nSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

siteSettingSchema.index({ siteName: 1 });

const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);

module.exports = SiteSetting;
