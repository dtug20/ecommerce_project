const express = require('express');
const router = express.Router();
// internal
const brandController = require('../controller/brand.controller');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

// add Brand
router.post('/add', verifyToken, authorization("admin", "manager"), brandController.addBrand);
// add All Brand
router.post('/add-all', verifyToken, authorization("admin", "manager"), brandController.addAllBrand);
// get Active Brands
router.get('/active',brandController.getActiveBrands);
// get all Brands
router.get('/all',brandController.getAllBrands);
// delete brand
router.delete('/delete/:id', verifyToken, authorization("admin", "manager"), brandController.deleteBrand);
// get single
router.get('/get/:id', brandController.getSingleBrand);
// edit brand
router.patch('/edit/:id', verifyToken, authorization("admin", "manager"), brandController.updateBrand);

module.exports = router;