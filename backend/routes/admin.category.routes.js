const router = require('express').Router();
const controller = require('../controller/admin.category.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

router.use(verifyToken, authorization('admin', 'manager', 'staff'));

router.get('/', controller.getAllCategories);
router.get('/stats', controller.getCategoryStats);
router.get('/tree', controller.getCategoryTree);
router.get('/:id', controller.getCategoryById);
router.post('/', controller.createCategory);
router.patch('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

module.exports = router;
