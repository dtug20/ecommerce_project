const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cmsController');
const attachProxy = require('../middleware/attachProxy');

router.use(attachProxy);

// ---------------------------------------------------------------------------
// Banners
// Note: /banners/priority must precede /banners/:id
// ---------------------------------------------------------------------------

router.patch('/banners/priority', cmsController.updateBannerPriority);
router.get('/banners', cmsController.listBanners);
router.get('/banners/:id', cmsController.getBanner);
router.post('/banners', cmsController.createBanner);
router.patch('/banners/:id', cmsController.updateBanner);
router.delete('/banners/:id', cmsController.deleteBanner);

// ---------------------------------------------------------------------------
// Blog
// Note: /blog/:id/publish and /blog/:id/unpublish before /blog/:id
// ---------------------------------------------------------------------------

router.patch('/blog/:id/publish', cmsController.publishBlogPost);
router.patch('/blog/:id/unpublish', cmsController.unpublishBlogPost);
router.get('/blog', cmsController.listBlogPosts);
router.get('/blog/:id', cmsController.getBlogPost);
router.post('/blog', cmsController.createBlogPost);
router.patch('/blog/:id', cmsController.updateBlogPost);
router.delete('/blog/:id', cmsController.deleteBlogPost);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

router.get('/settings', cmsController.getSettings);
router.patch('/settings', cmsController.updateSettings);

module.exports = router;
