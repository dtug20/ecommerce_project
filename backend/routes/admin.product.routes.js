const router = require('express').Router();
const controller = require('../controller/admin.product.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

router.use(verifyToken, authorization('admin', 'manager', 'staff'));

router.get('/', controller.getAllProducts);
router.get('/stats', controller.getProductStats);
router.get('/:id', controller.getProductById);
router.post('/', controller.createProduct);
router.patch('/:id', controller.updateProduct);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
