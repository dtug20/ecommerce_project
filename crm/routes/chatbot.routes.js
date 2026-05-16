const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/chatbotController');

router.use(attachProxy);

router.get('/sessions', ctrl.listSessions);
router.get('/analytics', ctrl.getAnalytics);

module.exports = router;
