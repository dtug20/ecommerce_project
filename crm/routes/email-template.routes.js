const router = require('express').Router();
const attachProxy = require('../middleware/attachProxy');
const ctrl = require('../controllers/emailTemplateController');

router.use(attachProxy);

router.get('/', ctrl.listTemplates);
router.get('/:id', ctrl.getTemplate);
router.patch('/:id', ctrl.updateTemplate);
router.post('/:id/preview', ctrl.previewTemplate);
router.post('/:id/test', ctrl.sendTestEmail);

module.exports = router;
