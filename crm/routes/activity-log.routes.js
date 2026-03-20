const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/activityLogController');

router.use(attachProxy);

// export must come before /:id style routes
router.get('/export', ctrl.exportCsv);
router.get('/', ctrl.listLogs);

module.exports = router;
