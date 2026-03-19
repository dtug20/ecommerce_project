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
},{
  timestamps: true
})

const Category = mongoose.model('Category',CategorySchema);
module.exports = Category;