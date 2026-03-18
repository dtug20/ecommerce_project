const express = require('express');
const router = express.Router();
// internal
const uploader = require('../middleware/uploder');
const { cloudinaryController } = require('../controller/cloudinary.controller');
const multer = require('multer');
const verifyToken = require('../middleware/verifyToken');
const authorization = require('../middleware/authorization');

const upload = multer();
//add image
router.post('/add-img', verifyToken, authorization("admin", "manager"), upload.single('image'), cloudinaryController.saveImageCloudinary);

//add image
router.post('/add-multiple-img', verifyToken, authorization("admin", "manager"), upload.array('images',5), cloudinaryController.addMultipleImageCloudinary);

//delete image
router.delete('/img-delete', verifyToken, authorization("admin", "manager"), cloudinaryController.cloudinaryDeleteController);

module.exports = router;