const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/stats', productController.getProductStats);
// Currency audit (Phase 2) — must precede /:id routes
router.get('/currency-audit', productController.listCurrencyAudit);
router.post('/bulk-normalize-currency', productController.normalizeCurrencyBulk);
router.get('/:id', productController.getProductById);
router.post('/:id/normalize-currency', productController.normalizeCurrencyOne);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
