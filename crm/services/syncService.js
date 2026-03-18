const mongoose = require('mongoose');
const axios = require('axios');

// Frontend database connection (separate from CRM) — lazy, won't crash if unavailable
let frontendConnection;
try {
  frontendConnection = mongoose.createConnection(process.env.FRONTEND_MONGO_URI || 'mongodb://127.0.0.1:27017/shofy', {
    serverSelectionTimeoutMS: 5000,
  });
  frontendConnection.on('error', (err) => console.warn('Frontend DB connection error:', err.message));
} catch (err) {
  console.warn('Frontend DB connection failed:', err.message);
}

// Frontend Product Schema (matching the frontend model structure)
const FrontendProductSchema = new mongoose.Schema({
  id: String,
  sku: String,
  img: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 3,
    maxLength: 200
  },
  slug: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  status: {
    type: String,
    enum: ['Show', 'Hide'],
    default: 'Show'
  },
  featured: {
    type: Boolean,
    default: false
  },
  colors: [String],
  sizes: [String],
  tags: [String],
  shipping: Number,
  sellCount: {
    type: Number,
    default: 0
  },
  rating: {
    rating: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  finalPrice: Number
}, {
  timestamps: true
});

// Frontend Category Schema
const FrontendCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    lowercase: true
  },
  img: String,
  parent: {
    type: String,
    required: true,
    trim: true
  },
  children: [String],
  productType: {
    type: String,
    trim: true,
    required: true,
    lowercase: true
  },
  description: String,
  status: {
    type: String,
    enum: ['Show', 'Hide'],
    default: 'Show'
  },
  featured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Frontend User Schema  
const FrontendUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: ''
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  }
}, {
  timestamps: true
});

const FrontendProduct = frontendConnection.model('Product', FrontendProductSchema);
const FrontendCategory = frontendConnection.model('Category', FrontendCategorySchema);
const FrontendUser = frontendConnection.model('User', FrontendUserSchema);

class SyncService {
  
  // Map CRM product to Frontend product format
  static mapProductToFrontend(crmProduct) {
    return {
      id: crmProduct._id.toString(),
      sku: crmProduct.slug,
      img: crmProduct.img,
      title: crmProduct.title,
      slug: crmProduct.slug,
      description: crmProduct.description,
      price: crmProduct.price,
      discount: crmProduct.discount || 0,
      quantity: crmProduct.quantity,
      category: crmProduct.category,
      status: crmProduct.status,
      featured: crmProduct.featured || false,
      colors: crmProduct.colors || [],
      sizes: crmProduct.sizes || [],
      tags: crmProduct.tags || [],
      shipping: crmProduct.shipping || 0,
      sellCount: crmProduct.sellCount || 0,
      rating: crmProduct.rating || { rating: 0, count: 0 },
      finalPrice: crmProduct.finalPrice
    };
  }

  // Map CRM category to Frontend category format
  static mapCategoryToFrontend(crmCategory) {
    return {
      name: crmCategory.name || crmCategory.parent,
      slug: crmCategory.slug,
      img: crmCategory.img,
      parent: crmCategory.parent,
      children: crmCategory.children || [],
      productType: crmCategory.productType,
      description: crmCategory.description,
      status: crmCategory.status,
      featured: crmCategory.featured || false,
      sortOrder: crmCategory.sortOrder || 0
    };
  }

  // Map CRM user to Frontend user format
  static mapUserToFrontend(crmUser) {
    return {
      name: crmUser.name,
      email: crmUser.email,
      password: crmUser.password,
      phone: crmUser.phone,
      address: crmUser.address,
      role: crmUser.role,
      status: crmUser.status,
      avatar: crmUser.avatar,
      emailVerified: crmUser.emailVerified,
      lastLogin: crmUser.lastLogin,
      dateOfBirth: crmUser.dateOfBirth,
      gender: crmUser.gender
    };
  }

  // Sync single product to frontend
  static async syncProduct(crmProduct, operation = 'upsert') {
    try {
      const frontendData = this.mapProductToFrontend(crmProduct);
      
      if (operation === 'delete') {
        await FrontendProduct.findOneAndDelete({ id: crmProduct._id.toString() });
        console.log(`🔄 Deleted product ${crmProduct.title} from frontend`);
      } else {
        await FrontendProduct.findOneAndUpdate(
          { id: crmProduct._id.toString() },
          frontendData,
          { upsert: true, new: true }
        );
        console.log(`🔄 Synced product ${crmProduct.title} to frontend`);
      }
    } catch (error) {
      console.error('❌ Product sync error:', error.message);
    }
  }

  // Sync single category to frontend
  static async syncCategory(crmCategory, operation = 'upsert') {
    try {
      const frontendData = this.mapCategoryToFrontend(crmCategory);
      
      if (operation === 'delete') {
        await FrontendCategory.findByIdAndDelete(crmCategory._id);
        console.log(`🔄 Deleted category ${crmCategory.parent} from frontend`);
      } else {
        await FrontendCategory.findByIdAndUpdate(
          crmCategory._id,
          frontendData,
          { upsert: true, new: true }
        );
        console.log(`🔄 Synced category ${crmCategory.parent} to frontend`);
      }
    } catch (error) {
      console.error('❌ Category sync error:', error.message);
    }
  }

  // Sync single user to frontend
  static async syncUser(crmUser, operation = 'upsert') {
    try {
      const frontendData = this.mapUserToFrontend(crmUser);
      
      if (operation === 'delete') {
        await FrontendUser.findByIdAndDelete(crmUser._id);
        console.log(`🔄 Deleted user ${crmUser.name} from frontend`);
      } else {
        await FrontendUser.findByIdAndUpdate(
          crmUser._id,
          frontendData,
          { upsert: true, new: true }
        );
        console.log(`🔄 Synced user ${crmUser.name} to frontend`);
      }
    } catch (error) {
      console.error('❌ User sync error:', error.message);
    }
  }

  // Sync all products from CRM to frontend
  static async syncAllProducts() {
    try {
      const Product = require('../models/Product');
      const products = await Product.find({}).populate('category');
      
      console.log(`🔄 Syncing ${products.length} products to frontend...`);
      
      for (const product of products) {
        await this.syncProduct(product);
      }
      
      console.log('✅ All products synced successfully');
      return { success: true, count: products.length };
    } catch (error) {
      console.error('❌ Bulk product sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync all categories from CRM to frontend
  static async syncAllCategories() {
    try {
      const Category = require('../models/Category');
      const categories = await Category.find({});
      
      console.log(`🔄 Syncing ${categories.length} categories to frontend...`);
      
      for (const category of categories) {
        await this.syncCategory(category);
      }
      
      console.log('✅ All categories synced successfully');
      return { success: true, count: categories.length };
    } catch (error) {
      console.error('❌ Bulk category sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync all users from CRM to frontend
  static async syncAllUsers() {
    try {
      const User = require('../models/User');
      const users = await User.find({}).select('-password');
      
      console.log(`🔄 Syncing ${users.length} users to frontend...`);
      
      for (const user of users) {
        await this.syncUser(user);
      }
      
      console.log('✅ All users synced successfully');
      return { success: true, count: users.length };
    } catch (error) {
      console.error('❌ Bulk user sync error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Sync everything
  static async syncAll() {
    console.log('🚀 Starting full sync to frontend...');
    
    const results = await Promise.all([
      this.syncAllCategories(),
      this.syncAllProducts(),
      this.syncAllUsers()
    ]);
    
    console.log('🎉 Full sync completed!');
    return {
      categories: results[0],
      products: results[1],
      users: results[2]
    };
  }
}

module.exports = {
  SyncService,
  FrontendProduct,
  FrontendCategory,
  FrontendUser
};