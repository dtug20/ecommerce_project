const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/reviewController');

router.use(attachProxy);

// Note: specific action routes (/approve, /reject, /reply) must precede /:id
router.get('/', ctrl.listReviews);
router.get('/:id', ctrl.getReview);
router.patch('/:id/approve', ctrl.approveReview);
router.patch('/:id/reject', ctrl.rejectReview);
router.post('/:id/reply', ctrl.replyToReview);
router.delete('/:id', ctrl.deleteReview);

module.exports = router;
