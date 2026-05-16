'use strict';

/**
 * Chatbot Admin Controller — v1
 *
 * Read-only endpoints for the CRM analytics page. No mutations.
 */

const ChatSession = require('../../model/ChatSession');
const ChatFeedback = require('../../model/ChatFeedback');
const respond = require('../../utils/respond');

/**
 * GET /api/v1/admin/chat/sessions
 * Paginated list of chat sessions, newest first.
 */
exports.listSessions = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || '20', 10), 1),
      100
    );

    const [sessions, total] = await Promise.all([
      ChatSession.find({})
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('sessionId userId anonId locale status messages updatedAt createdAt')
        .lean(),
      ChatSession.countDocuments({}),
    ]);

    return respond.success(res, {
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        userId: s.userId,
        anonId: s.anonId,
        locale: s.locale,
        status: s.status,
        messageCount: Array.isArray(s.messages) ? s.messages.length : 0,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/chat/analytics
 * Last-30-days rollup: session/message counts and thumbs feedback.
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalSessions, totalMessagesAgg, feedbackAgg] = await Promise.all([
      ChatSession.countDocuments({ createdAt: { $gte: since } }),
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $project: { count: { $size: { $ifNull: ['$messages', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
      ChatFeedback.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const fb = { up: 0, down: 0 };
    feedbackAgg.forEach((row) => {
      if (row._id === 'up' || row._id === 'down') {
        fb[row._id] = row.count;
      }
    });
    const total = fb.up + fb.down;

    return respond.success(res, {
      last30Days: {
        totalSessions,
        totalMessages: totalMessagesAgg[0]?.total || 0,
        thumbsUp: fb.up,
        thumbsDown: fb.down,
        satisfactionRate: total > 0 ? fb.up / total : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
