const mongoose = require("mongoose");
const validator = require("validator");
const { ObjectId } = mongoose.Schema.Types;

const brandSchema = mongoose.Schema({
  logo: {
    type: String,
    required: false,
    validate: [validator.isURL, "Please provide valid url(s)"]
  },
  name: {
    type: String,
    trim: true,
    required: [true, "Please provide a brand name"],
    maxLength: 100,
    unique: true,
  },
  description: String,
  email: {
    type: String,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  website: {
    type: String,
    validate: [validator.isURL, "Please provide a valid url"]
  },
  location: String,
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  products: [{
    type: ObjectId,
    ref: "Products"
  }],

  // Extended brand fields
  slug: { type: String, unique: true, sparse: true },
  featured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true
});

brandSchema.index({ slug: 1 }, { unique: true, sparse: true });
brandSchema.index({ featured: 1 });
brandSchema.index({ sortOrder: 1 });

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;




