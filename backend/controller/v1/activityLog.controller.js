'use strict';

/**
 * Activity Log controller — v1
 *
 * Read-only endpoints for browsing and exporting the activity log.
 * Write access is handled exclusively by the activityLog middleware.
 */

const ActivityLog = require('../../model/ActivityLog');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// GET /api/v1/admin/activity-log
// Paginated list with optional filters.
// Query: actorId, resourceType, action, startDate, endDate
// ---------------------------------------------------------------------------

exports.listLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const filter = {};

    if (req.query.actorId) {
      filter['actor.id'] = req.query.actorId;
    }

    if (req.query.resourceType) {
      filter['resource.type'] = req.query.resourceType;
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Include the full end day
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const [logs, totalItems] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return respond.paginated(
      res,
      logs,
      buildPagination(page, limit, totalItems),
      'Activity logs retrieved'
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/activity-log/export
// Streams a CSV file of activity logs matching the same query filters.
// Requires admin role (enforced at route level).
// ---------------------------------------------------------------------------

exports.exportLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.actorId) {
      filter['actor.id'] = req.query.actorId;
    }

    if (req.query.resourceType) {
      filter['resource.type'] = req.query.resourceType;
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const filename = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // CSV header row
    const HEADERS = [
      'Timestamp',
      'Actor ID',
      'Actor Name',
      'Actor Role',
      'Actor Type',
      'Action',
      'Resource Type',
      'Resource ID',
      'Resource Name',
      'IP Address',
      'User Agent',
    ];
    res.write(HEADERS.join(',') + '\n');

    // Stream using a mongoose cursor to avoid loading all records into memory
    const cursor = ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .lean()
      .cursor();

    cursor.on('data', (doc) => {
      const row = [
        escapeCSV(doc.timestamp ? doc.timestamp.toISOString() : ''),
        escapeCSV(doc.actor?.id ? doc.actor.id.toString() : ''),
        escapeCSV(doc.actor?.name || ''),
        escapeCSV(doc.actor?.role || ''),
        escapeCSV(doc.actor?.type || ''),
        escapeCSV(doc.action || ''),
        escapeCSV(doc.resource?.type || ''),
        escapeCSV(doc.resource?.id ? doc.resource.id.toString() : ''),
        escapeCSV(doc.resource?.name || ''),
        escapeCSV(doc.ipAddress || ''),
        escapeCSV(doc.userAgent || ''),
      ];
      res.write(row.join(',') + '\n');
    });

    cursor.on('end', () => res.end());

    cursor.on('error', (err) => {
      console.error('[activityLog] Export cursor error:', err.message);
      // Can't change headers once streaming has started
      res.end();
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Escape a value for CSV: wrap in quotes and double-escape any internal quotes.
 * @param {string} value
 * @returns {string}
 */
function escapeCSV(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
