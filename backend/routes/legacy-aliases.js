'use strict';

/**
 * Legacy API aliases — /api/*
 *
 * REMOVED IN PHASE 5 (2026-03-20): This file is no longer mounted in index.js.
 * All consumers must migrate to /api/v1/* paths.
 *
 * This file is kept for reference only. Do not re-mount it.
 * Original sunset date was: 2026-08-01.
 */

const express = require('express');
const router = express.Router();

/**
 * Inject HTTP deprecation headers on every legacy response so API clients
 * can detect the sunset and migrate to the v1 routes.
 *
 * @param {string} v1Path  The equivalent /api/v1/... path (without /api prefix)
 */
const makeDeprecationMiddleware = (v1Path) => (req, res, next) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', 'Sat, 01 Aug 2026 00:00:00 GMT');
  // Build the successor Link header from the original request path
  const successor = v1Path || req.originalUrl.replace(/^\/api/, '/api/v1');
  res.set('Link', `<${successor}>; rel="successor-version"`);
  next();
};

// ---------------------------------------------------------------------------
// Storefront resources
// ---------------------------------------------------------------------------

router.use('/product',
  makeDeprecationMiddleware('/api/v1/store/products'),
  require('./product.routes')
);

router.use('/category',
  makeDeprecationMiddleware('/api/v1/store/categories'),
  require('./category.routes')
);

router.use('/brand',
  makeDeprecationMiddleware('/api/v1/store/brands'),
  require('./brand.routes')
);

router.use('/order',
  makeDeprecationMiddleware('/api/v1/user/orders'),
  require('./order.routes')
);

router.use('/coupon',
  makeDeprecationMiddleware('/api/v1/store/coupons'),
  require('./coupon.routes')
);

router.use('/user',
  makeDeprecationMiddleware('/api/v1/user/profile'),
  require('./user.routes')
);

router.use('/user-order',
  makeDeprecationMiddleware('/api/v1/user/orders'),
  require('./user.order.routes')
);

router.use('/review',
  makeDeprecationMiddleware('/api/v1/user/reviews'),
  require('./review.routes')
);

router.use('/cloudinary',
  makeDeprecationMiddleware('/api/v1/admin/media'),
  require('./cloudinary.routes')
);

// ---------------------------------------------------------------------------
// Admin resources
// ---------------------------------------------------------------------------

router.use('/admin/products',
  makeDeprecationMiddleware('/api/v1/admin/products'),
  require('./admin.product.routes')
);

router.use('/admin/categories',
  makeDeprecationMiddleware('/api/v1/admin/categories'),
  require('./admin.category.routes')
);

router.use('/admin/orders',
  makeDeprecationMiddleware('/api/v1/admin/orders'),
  require('./admin.order.routes')
);

router.use('/admin/users',
  makeDeprecationMiddleware('/api/v1/admin/users'),
  require('./admin.user.routes')
);

// Base admin route last — avoids shadowing the sub-prefixes above
router.use('/admin',
  makeDeprecationMiddleware('/api/v1/admin/staff'),
  require('./admin.routes')
);

module.exports = router;
