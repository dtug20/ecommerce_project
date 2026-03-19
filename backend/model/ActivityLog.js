const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide an actor id"],
    },
    name: {
      type: String,
      required: [true, "Please provide an actor name"],
    },
    role: {
      type: String,
      required: [true, "Please provide an actor role"],
    },
    type: {
      type: String,
      required: [true, "Please provide an actor type"],
      enum: ["admin", "system", "vendor"],
    },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Please provide a resource type"],
      enum: [
        "product",
        "category",
        "order",
        "user",
        "vendor",
        "page",
        "menu",
        "banner",
        "blog",
        "setting",
        "coupon",
        "email-template",
      ],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: {
      type: String,
    },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: actorSchema,
      required: [true, "Please provide actor information"],
    },
    action: {
      type: String,
      required: [true, "Please provide an action"],
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "import",
        "sync",
        "status-change",
      ],
    },
    resource: {
      type: resourceSchema,
      required: [true, "Please provide resource information"],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      required: [true, "Please provide a timestamp"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
activityLogSchema.index({ "actor.id": 1 });
activityLogSchema.index({ "actor.type": 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ "resource.type": 1 });
activityLogSchema.index({ "resource.id": 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ "actor.id": 1, timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;
