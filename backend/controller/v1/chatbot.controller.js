'use strict';

const chatbot = require('../../services/chatbot');
const ChatSession = require('../../model/ChatSession');
const ChatFeedback = require('../../model/ChatFeedback');
const respond = require('../../utils/respond');

exports.sendMessage = async (req, res) => {
  const { sessionId, message, locale, cartSnapshot, recentlyViewedProducts } = req.body;
  const userId = req.user && req.user._id ? req.user._id : null;
  const anonId = req.headers['x-anon-id'] || req.ip;

  const io = global.io;
  const room = `chat:${sessionId}`;

  const out = await chatbot.handleMessage({
    sessionId,
    userId,
    anonId,
    locale,
    userMessage: message,
    cartSnapshot,
    recentlyViewedProducts,
    onToken: (t) => { if (io) io.to(room).emit('chat:token', { sessionId, token: t }); },
    onToolCall: (tc) => { if (io) io.to(room).emit('chat:tool_call', { sessionId, ...tc }); }
  });

  if (out.error) {
    if (io) io.to(room).emit('chat:error', out);
    return respond.error(res, out.error, out.message || out.error, 400, out);
  }
  if (io) io.to(room).emit('chat:done', out);
  return respond.success(res, out, 'Message processed');
};

exports.getSession = async (req, res) => {
  const userId = req.user && req.user._id;
  const s = await ChatSession.findOne({ sessionId: req.params.id }).lean();
  if (!s) return respond.error(res, 'NOT_FOUND', 'Session not found', 404);
  if (s.userId && String(s.userId) !== String(userId)) return respond.error(res, 'FORBIDDEN', 'Forbidden', 403);
  return respond.success(res, { session: s });
};

exports.endSession = async (req, res) => {
  await ChatSession.updateOne({ sessionId: req.params.id }, { status: 'ended', endedAt: new Date() });
  return respond.success(res, { ended: true });
};

exports.submitFeedback = async (req, res) => {
  const userId = req.user && req.user._id;
  const fb = await ChatFeedback.create({ ...req.body, userId });
  return respond.success(res, { feedback: fb }, 'Feedback recorded');
};
