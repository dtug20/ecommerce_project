const express = require('express');
const router = express.Router();
// internal
const categoryController = require('../controller/category.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

// get
router.get('/get/:id', categoryController.getSingleCategory);
// add
router.post('/add', verifyToken, authorization("admin", "manager"), categoryController.addCategory);
// add All Category
router.post('/add-all', verifyToken, authorization("admin", "manager"), categoryController.addAllCategory);
// get all Category
router.get('/all', categoryController.getAllCategory);
// get Product Type Category
router.get('/show/:type', categoryController.getProductTypeCategory);
// get Show Category
router.get('/show', categoryController.getShowCategory);
// delete category
router.delete('/delete/:id', verifyToken, authorization("admin", "manager"), categoryController.deleteCategory);
// edit category
router.patch('/edit/:id', verifyToken, authorization("admin", "manager"), categoryController.updateCategory);

module.exports = router;