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

/**
 * Shipping config. All amounts are stored in the platform base currency (VND).
 * The frontend converts to the user's display currency via useCurrency().formatPrice().
 */
const shippingMethodSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    labelVi: { type: String, default: "" },
    cost: { type: Number, default: 0, min: 0 }, // VND
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    freeShippingThreshold: {
      type: Number,
      default: 0,
    }, // VND
    defaultShippingCost: {
      type: Number,
      default: 0,
    }, // VND
    enabledMethods: {
      type: [String],
      default: [],
    },
    methods: {
      type: [shippingMethodSchema],
      default: [
        { id: "free", label: "Free shipping", labelVi: "Miễn phí", cost: 0, enabled: true },
        { id: "flat", label: "Flat rate", labelVi: "Phí cố định", cost: 20000, enabled: true },
        { id: "pickup", label: "Local pickup", labelVi: "Nhận tại cửa hàng", cost: 25000, enabled: true },
      ],
    },
  },
  { _id: false }
);

const bankTransferSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountName: { type: String, default: '' },
    branch: { type: String, default: '' },
    qrImageUrl: { type: String, default: '' },
    transferContentTemplate: { type: String, default: '' },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    enabledGateways: {
      type: [String],
      default: ["stripe", "cod"],
    },
    bankTransfer: {
      type: bankTransferSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

/**
 * Tax config. Flat-rate VAT applied to (subtotal - discount + shipping) at checkout.
 * Prices throughout the storefront are tax-EXCLUSIVE — tax is added on top at checkout.
 */
const taxSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    rate: { type: Number, default: 0, min: 0, max: 100 }, // percent
    label: { type: String, default: "VAT" },
    labelVi: { type: String, default: "Thuế" },
    applyToShipping: { type: Boolean, default: true },
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
    tax: {
      type: taxSchema,
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
    chatbot: {
      enabled: { type: Boolean, default: true },
      welcomeMessage: {
        en: { type: String, default: 'Hi! I\'m your shopping assistant. How can I help today?' },
        vi: { type: String, default: 'Xin chào! Tôi là trợ lý mua sắm. Tôi có thể giúp gì cho bạn?' }
      }
    },
  },
  {
    timestamps: true,
  }
);

siteSettingSchema.index({ siteName: 1 });

const SiteSetting = mongoose.model("SiteSetting", siteSettingSchema);

module.exports = SiteSetting;
