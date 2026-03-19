const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a template name"],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Please provide a template slug"],
      unique: true,
    },
    type: {
      type: String,
      required: [true, "Please provide a template type"],
      enum: [
        "order-confirmation",
        "order-shipped",
        "order-delivered",
        "order-cancelled",
        "welcome",
        "password-reset",
        "vendor-application",
        "vendor-approved",
        "low-stock-alert",
      ],
    },
    subject: {
      type: String,
      required: [true, "Please provide a template subject"],
    },
    subjectVi: {
      type: String,
    },
    body: {
      type: String,
      required: [true, "Please provide a template body"],
    },
    bodyVi: {
      type: String,
    },
    variables: {
      type: [String],
      default: [],
    },
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

emailTemplateSchema.index({ name: 1 }, { unique: true });
emailTemplateSchema.index({ slug: 1 }, { unique: true });
emailTemplateSchema.index({ type: 1 });
emailTemplateSchema.index({ status: 1 });
emailTemplateSchema.index({ type: 1, isDefault: 1 });

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

module.exports = EmailTemplate;
