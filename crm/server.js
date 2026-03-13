const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shofy');
    console.log('✅ CRM Connected to MongoDB (shofy database)');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sync', require('./routes/sync.routes'));

// Dashboard Routes
app.get('/', (req, res) => {
  res.render('dashboard', { title: 'Shofy CRM Dashboard' });
});

app.get('/products', (req, res) => {
  res.render('products', { title: 'Product Management' });
});

app.get('/categories', (req, res) => {
  res.render('categories', { title: 'Category Management' });
});

app.get('/orders', (req, res) => {
  res.render('orders', { title: 'Order Management' });
});

app.get('/users', (req, res) => {
  res.render('users', { title: 'User Management' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Connect to database and start server
connectDB().then(() => {
  const PORT = process.env.CRM_PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Shofy CRM Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
  });
});

module.exports = app;