const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const validator = require("validator");

const productsSchema = mongoose.Schema({
  id: {
    type: String
  },
  sku: {
    type: String,
    required: false,
  },
  img:{
    type: String,
    required: false,
    validate: [validator.isURL, "Please provide valid url(s)"]
  },
  title: {
    type: String,
    required: [true, "Please provide a name for this product."],
    trim: true,
    minLength: [3, "Name must be at least 3 characters."],
    maxLength: [200, "Name is too large"],
  },
  slug: {
    type: String,
    trim: true,
    required: false,
  },
  unit: {
    type: String,
    required: false,
    default: "pcs"
  },
  imageURLs: [{
    color:{
      name:{
        type: String,
        required: false,
        trim: true,
      },
      clrCode:{
        type: String,
        required: false,
        trim: true,
      }
    },
    img:{
      type: String,
      required: false,
      validate: [validator.isURL, "Please provide valid url(s)"]
    },
    sizes:[String]
  }],
  parent:{
    type:String,
    required:false,
    trim:true,
   },
  children:{
    type:String,
    required:false,
    trim:true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Product price can't be negative"]
  },
  discount: {
    type: Number,
    min: [0, "Product price can't be negative"],
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, "Product quantity can't be negative"]
  },
  brand: {
    name: {
      type: String,
      required: false,
    },
    id: {
      type: ObjectId,
      ref: "Brand",
      required: false,
    }
  },
  category: {
    name: {
      type: String,
      required: false,
    },
    id: {
      type: ObjectId,
      ref: "Category",
      required: false,
    }
  },
  status: {
    type: String,
    required: false,
    enum: {
      values: ["in-stock", "out-of-stock", "discontinued"],
      message: "status can't be {VALUE} "
    },
    default: "in-stock",
  },
  reviews: [{type:ObjectId, ref: 'Reviews' }],
  productType:{
    type:String,
    required: false,
    lowercase: true,
    default: "general"
  },
  description: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: false
  },
  additionalInformation: [{}],
  tags: [String],
  sizes: [String],
  offerDate:{
    startDate:{
      type:Date
    },
    endDate:{
      type:Date
    },
  },
  featured: {
    type: Boolean,
    default: false,
  },
  sellCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'products'  // Explicitly use 'products' collection
});

const Products = mongoose.model('Products', productsSchema);

module.exports = Products;