const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Models
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');
const Order = require('./models/Order');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce');
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Sample Categories Data
const sampleCategories = [
  {
    name: 'Electronics',
    parent: 'Electronics',
    productType: 'electronics',
    description: 'Electronic devices and gadgets',
    children: ['Smartphones', 'Laptops', 'Tablets'],
    status: 'Show',
    featured: true,
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
  },
  {
    name: 'Smartphones',
    parent: 'Smartphones', 
    productType: 'electronics',
    description: 'Mobile phones and accessories',
    children: [],
    status: 'Show',
    featured: true,
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
  },
  {
    name: 'Laptops',
    parent: 'Laptops',
    productType: 'electronics',
    description: 'Portable computers and accessories',
    children: [],
    status: 'Show',
    featured: true,
    img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'
  },
  {
    name: 'Fashion',
    parent: 'Fashion',
    productType: 'clothing',
    description: 'Clothing and fashion accessories',
    children: ['Men Clothing', 'Women Clothing', 'Shoes'],
    status: 'Show',
    featured: false,
    img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
  },
  {
    name: 'Home & Garden',
    parent: 'Home & Garden',
    productType: 'home',
    description: 'Home decor and garden supplies',
    children: ['Furniture', 'Kitchen', 'Garden Tools'],
    status: 'Show',
    featured: false,
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
  }
];

// Sample Users Data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@shofy.com',
    password: 'password123',
    phone: '+1-555-0101',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    gender: 'male',
    address: '123 Admin Street, San Francisco, CA 94105, USA'
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    phone: '+1-555-0102',
    role: 'user',
    status: 'active',
    emailVerified: true,
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    address: '456 Customer Ave, New York, NY 10001, USA'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    phone: '+1-555-0103',
    role: 'user',
    status: 'active',
    emailVerified: false,
    gender: 'female',
    dateOfBirth: new Date('1988-12-22'),
    address: '789 Main Street, Los Angeles, CA 90210, USA'
  },
  {
    name: 'Staff Member',
    email: 'staff@shofy.com',
    password: 'password123',
    phone: '+1-555-0104',
    role: 'staff',
    status: 'active',
    emailVerified: true,
    gender: 'female'
  }
];

// Sample Products Data (will be created after categories)
const createSampleProducts = async (categories) => {
  const electronicsCategory = categories.find(cat => cat.parent === 'Electronics');
  const smartphonesCategory = categories.find(cat => cat.parent === 'Smartphones');
  const laptopsCategory = categories.find(cat => cat.parent === 'Laptops');
  const fashionCategory = categories.find(cat => cat.parent === 'Fashion');

  return [
    {
      title: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
      price: 999,
      discount: 5,
      quantity: 50,
      category: smartphonesCategory._id,
      status: 'Show',
      featured: true,
      img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
      sizes: ['128GB', '256GB', '512GB', '1TB'],
      tags: ['smartphone', 'apple', 'ios', 'premium'],
      shipping: 0
    },
    {
      title: 'MacBook Pro 14"',
      slug: 'macbook-pro-14',
      description: 'Powerful laptop with M3 chip, Liquid Retina XDR display',
      price: 1999,
      discount: 10,
      quantity: 25,
      category: laptopsCategory._id,
      status: 'Show',
      featured: true,
      img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      colors: ['Space Gray', 'Silver'],
      sizes: ['512GB', '1TB'],
      tags: ['laptop', 'apple', 'macbook', 'professional'],
      shipping: 0
    },
    {
      title: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Premium Android smartphone with S Pen and advanced AI features',
      price: 1199,
      discount: 8,
      quantity: 35,
      category: smartphonesCategory._id,
      status: 'Show',
      featured: true,
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'],
      sizes: ['256GB', '512GB', '1TB'],
      tags: ['smartphone', 'samsung', 'android', 'premium'],
      shipping: 15
    },
    {
      title: 'Dell XPS 13',
      slug: 'dell-xps-13',
      description: 'Ultra-portable laptop with Intel Core i7 and stunning display',
      price: 1299,
      discount: 15,
      quantity: 20,
      category: laptopsCategory._id,
      status: 'Show',
      featured: false,
      img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      colors: ['Platinum Silver', 'Frost White'],
      sizes: ['256GB', '512GB'],
      tags: ['laptop', 'dell', 'ultrabook', 'portable'],
      shipping: 25
    },
    {
      title: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones',
      description: 'Premium noise-canceling headphones with 30-hour battery life',
      price: 199,
      discount: 20,
      quantity: 100,
      category: electronicsCategory._id,
      status: 'Show',
      featured: true,
      img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      colors: ['Black', 'White', 'Blue', 'Red'],
      sizes: ['One Size'],
      tags: ['headphones', 'wireless', 'bluetooth', 'audio'],
      shipping: 10
    },
    {
      title: 'Smart Watch Series 9',
      slug: 'smart-watch-series-9',
      description: 'Advanced fitness tracking and health monitoring smartwatch',
      price: 399,
      discount: 12,
      quantity: 75,
      category: electronicsCategory._id,
      status: 'Show',
      featured: false,
      img: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400',
      colors: ['Midnight', 'Starlight', 'Silver', 'Product Red'],
      sizes: ['41mm', '45mm'],
      tags: ['smartwatch', 'fitness', 'health', 'wearable'],
      shipping: 5
    },
    {
      title: 'Gaming Mechanical Keyboard',
      slug: 'gaming-mechanical-keyboard',
      description: 'RGB backlit mechanical keyboard with tactile switches',
      price: 149,
      discount: 0,
      quantity: 60,
      category: electronicsCategory._id,
      status: 'Show',
      featured: false,
      img: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
      colors: ['Black', 'White'],
      sizes: ['Full Size', 'Compact'],
      tags: ['keyboard', 'gaming', 'mechanical', 'rgb'],
      shipping: 15
    },
    {
      title: 'Vintage T-Shirt',
      slug: 'vintage-t-shirt',
      description: 'Comfortable cotton t-shirt with vintage design',
      price: 29,
      discount: 0,
      quantity: 200,
      category: fashionCategory._id,
      status: 'Show',
      featured: false,
      img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      colors: ['Black', 'White', 'Navy', 'Gray'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      tags: ['t-shirt', 'cotton', 'vintage', 'casual'],
      shipping: 8
    }
  ];
};

// Sample Orders Data (will be created after users and products)
const createSampleOrders = async (users, products) => {
  const customer1 = users.find(user => user.email === 'john.doe@example.com');
  const customer2 = users.find(user => user.email === 'jane.smith@example.com');

  return [
    {
      userId: customer1._id,
      orderNumber: 'ORD-001',
      products: [
        {
          productId: products[0]._id,
          title: products[0].title,
          price: products[0].price,
          quantity: 1,
          image: products[0].img,
          color: 'Natural Titanium',
          size: '256GB'
        }
      ],
      totalAmount: 999,
      discount: 50,
      shippingCost: 0,
      tax: 89.91,
      finalAmount: 1038.91,
      shippingAddress: {
        name: customer1.name,
        address: customer1.address,
        city: '',
        zipCode: '',
        country: '',
        phone: customer1.phone
      },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      trackingNumber: 'TRK123456789',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Express delivery requested'
    },
    {
      userId: customer2._id,
      orderNumber: 'ORD-002',
      products: [
        {
          productId: products[1]._id,
          title: products[1].title,
          price: products[1].price,
          quantity: 1,
          image: products[1].img,
          color: 'Space Gray',
          size: '512GB'
        },
        {
          productId: products[4]._id,
          title: products[4].title,
          price: products[4].price,
          quantity: 1,
          image: products[4].img,
          color: 'Black',
          size: 'One Size'
        }
      ],
      totalAmount: 2198,
      discount: 0,
      shippingCost: 25,
      tax: 200.07,
      finalAmount: 2423.07,
      shippingAddress: {
        name: customer2.name,
        address: customer2.address,
        city: '',
        zipCode: '',
        country: '',
        phone: customer2.phone
      },
      paymentMethod: 'paypal',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      trackingNumber: 'TRK987654321',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  ];
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({})
    ]);

    // Create Categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${categories.length} categories`);

    // Hash passwords and create Users
    console.log('👥 Creating users...');
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );
    const users = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ Created ${users.length} users`);

    // Create Products
    console.log('📦 Creating products...');
    const sampleProducts = await createSampleProducts(categories);
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} products`);

    // Create Orders
    console.log('📋 Creating orders...');
    const sampleOrders = await createSampleOrders(users, products);
    const orders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${orders.length} orders`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log('\n🚀 You can now access your CRM at http://localhost:8080');
    console.log('\n📝 Default login credentials:');
    console.log('   Admin: admin@shofy.com / password123');
    console.log('   Staff: staff@shofy.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };