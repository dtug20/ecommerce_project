const router = require('express').Router();
const controller = require('../controller/admin.user.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

router.use(verifyToken, authorization('admin', 'manager', 'staff'));

router.get('/', controller.getAllUsers);
router.get('/stats', controller.getUserStats);
router.get('/:id', controller.getUserById);
router.get('/:id/orders', controller.getUserOrders);
router.post('/', controller.createUser);
router.patch('/:id', controller.updateUser);
router.patch('/:id/status', controller.updateUserStatus);
router.delete('/:id', controller.deleteUser);

module.exports = router;
