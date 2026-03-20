const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary with the backend's credentials as requested
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_NAME !== 'root' ? process.env.CLOUDINARY_NAME : 'dfddeabbs',
  api_key: process.env.CLOUDINARY_API_KEY || '522489467334284',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Hdem1GsQtR8Rbh8g2RoFDi3-Ncc',
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'shofy' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ success: false, message: error.message });
      }

      // Respond with the specific format expected by the frontend Upload components
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully!',
        data: { url: result.secure_url }
      });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

module.exports = router;
