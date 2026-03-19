const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const CategorySchema = mongoose.Schema({
  img:{
    type:String,
    required:false,
   },
   parent:{
    type:String,
    required:true,
    trim:true,
    unique:true,
   },
   children:[{type:String}],
   productType:{
    type:String,
    trim:true,
    required:true,
    lowercase: true,
   },
   description:{
    type:String,
    required:false,
   },
   products: [{
    type: ObjectId,
    ref: "Products"
  }],
   status: {
    type: String,
    enum: ['Show', 'Hide'],
    default: 'Show',
  },
  featured: {
    type: Boolean,
    default: false,
  },

  // Extended category fields
  name: { type: String },
  slug: { type: String, unique: true, sparse: true },
  icon: { type: String },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  ancestors: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      slug: { type: String, required: true },
    },
  ],
  level: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
},{
  timestamps: true
})

CategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
CategorySchema.index({ parentCategory: 1 }, { sparse: true });
CategorySchema.index({ level: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ "ancestors._id": 1 });

const Category = mongoose.model('Category',CategorySchema);
module.exports = Category;