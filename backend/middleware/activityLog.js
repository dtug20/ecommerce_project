'use strict';

/**
 * Activity Log middleware
 *
 * Usage (in route files):
 *   const { logActivity } = require('../../../middleware/activityLog');
 *   router.post('/products', authorization(...), logActivity('create', 'product'), ctrl.createProduct);
 *
 * The middleware intercepts the outbound res.json() call.  Only successful
 * responses (body.success === true) produce an activity log entry so that
 * validation errors, 404s, etc. do not pollute the audit trail.
 *
 * Activity logging is fire-and-forget — it never blocks or fails the response.
 */

const ActivityLog = require('../model/ActivityLog');

/**
 * Returns an Express middleware that logs an activity entry after the handler
 * returns a successful JSON response.
 *
 * @param {'create'|'update'|'delete'|'login'|'logout'|'export'|'import'|'sync'|'status-change'} action
 * @param {'product'|'category'|'order'|'user'|'vendor'|'page'|'menu'|'banner'|'blog'|'setting'|'coupon'|'email-template'} resourceType
 * @returns {import('express').RequestHandler}
 */
function logActivity(action, resourceType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Restore immediately so the response is not delayed
      res.json = originalJson;
      const result = originalJson(body);

      // Only log when the response indicates success
      if (body && body.success) {
        const actor = req.user
          ? {
              id: req.user._id || req.user.id,
              name: req.user.name || req.user.preferred_username || 'Unknown',
              role: req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : 'staff'),
              type: req.user.role === 'vendor' ? 'vendor' : 'admin',
            }
          : {
              id: new (require('mongoose').Types.ObjectId)(),
              name: 'System',
              role: 'system',
              type: 'system',
            };

        ActivityLog.create({
          actor,
          action,
          resource: {
            type: resourceType,
            id: body.data?._id || (req.params && req.params.id) || undefined,
            name:
              body.data?.title ||
              body.data?.name ||
              body.data?.storeName ||
              body.data?.slug ||
              null,
          },
          details: action === 'update' || action === 'status-change' ? { body: req.body } : {},
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent') || '',
          timestamp: new Date(),
        }).catch((err) => {
          console.error('[activityLog] Failed to create log entry:', err.message);
        });
      }

      return result;
    };

    next();
  };
}

module.exports = { logActivity };
