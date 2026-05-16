'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../../controller/v1/chatbot.controller');
const { validate } = require('../../middleware/validate');
const v = require('../../validations/chatbot.validation');
const verifyToken = require('../../middleware/verifyToken');

/**
 * Optional auth: attach req.user if a valid Bearer token is present,
 * but let the request through even if no token (or an invalid one) is given.
 */
function softAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return next();
  verifyToken(req, res, (err) => {
    // ignore token errors — request continues as anonymous
    if (err) return next();
    next();
  });
}

router.post('/message',        softAuth, validate(v.messageBody),  ctrl.sendMessage);
router.get('/sessions/:id',    softAuth,                           ctrl.getSession);
router.delete('/sessions/:id', softAuth,                           ctrl.endSession);
router.post('/feedback',       softAuth, validate(v.feedbackBody), ctrl.submitFeedback);

module.exports = router;
