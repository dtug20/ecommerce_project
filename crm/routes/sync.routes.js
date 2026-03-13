const express = require('express');
const { SyncService } = require('../services/syncService');
const router = express.Router();

// Sync all data to frontend 
router.post('/sync-all', async (req, res) => {
  try {
    const result = await SyncService.syncAll();
    res.json({
      success: true,
      message: 'Full sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during full sync',
      error: error.message
    });
  }
});

// Sync only products
router.post('/sync-products', async (req, res) => {
  try {
    const result = await SyncService.syncAllProducts();
    res.json({
      success: true,
      message: 'Products sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Sync products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing products',
      error: error.message
    });
  }
});

// Sync only categories  
router.post('/sync-categories', async (req, res) => {
  try {
    const result = await SyncService.syncAllCategories();
    res.json({
      success: true,
      message: 'Categories sync completed successfully', 
      data: result
    });
  } catch (error) {
    console.error('Sync categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing categories',
      error: error.message
    });
  }
});

// Sync only users
router.post('/sync-users', async (req, res) => {
  try {
    const result = await SyncService.syncAllUsers();
    res.json({
      success: true,
      message: 'Users sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Sync users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing users',
      error: error.message
    });
  }
});

// Get sync status
router.get('/sync-status', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Category = require('../models/Category'); 
    const User = require('../models/User');
    const { FrontendProduct, FrontendCategory, FrontendUser } = require('../services/syncService');
    
    const crmCounts = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      User.countDocuments()
    ]);
    
    const frontendCounts = await Promise.all([
      FrontendProduct.countDocuments(),
      FrontendCategory.countDocuments(),
      FrontendUser.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        crm: {
          products: crmCounts[0],
          categories: crmCounts[1],
          users: crmCounts[2]
        },
        frontend: {
          products: frontendCounts[0],
          categories: frontendCounts[1],
          users: frontendCounts[2]
        },
        synced: {
          products: crmCounts[0] === frontendCounts[0],
          categories: crmCounts[1] === frontendCounts[1],
          users: crmCounts[2] === frontendCounts[2]
        }
      }
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting sync status',
      error: error.message
    });
  }
});

module.exports = router;