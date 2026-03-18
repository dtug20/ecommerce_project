const express = require('express');
const router = express.Router();
// internal
const productController = require('../controller/product.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

// add a product
router.post('/add', verifyToken, authorization("admin", "manager"), productController.addProduct);
// add all product
router.post('/add-all', verifyToken, authorization("admin", "manager"), productController.addAllProducts);
// get all products
router.get('/all', productController.getAllProducts);
// get offer timer product
router.get('/offer', productController.getOfferTimerProducts);
// top rated products
router.get('/top-rated', productController.getTopRatedProducts);
// reviews products
router.get('/review-product', productController.reviewProducts);
// get popular products by type
router.get('/popular/:type', productController.getPopularProductByType);
// get Related Products
router.get('/related-product/:id', productController.getRelatedProducts);
// get Single Product
router.get("/single-product/:id", productController.getSingleProduct);
// stock Product
router.get("/stock-out", productController.stockOutProducts);
// edit Product
router.patch("/edit-product/:id", verifyToken, authorization("admin", "manager"), productController.updateProduct);
// get Products ByType
router.get('/:type', productController.getProductsByType);
// delete Product
router.delete('/:id', verifyToken, authorization("admin", "manager"), productController.deleteProduct);

module.exports = router;