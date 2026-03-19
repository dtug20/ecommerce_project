'use strict';

/**
 * CMS Controller — v1
 *
 * Manages Pages, Menus, Banners, Blog Posts, Site Settings, and Coupons
 * for the admin panel. All write operations emit Socket.io events.
 */

const mongoose = require('mongoose');
const Page = require('../../model/Page');
const Menu = require('../../model/Menu');
const Banner = require('../../model/Banner');
const BlogPost = require('../../model/BlogPost');
const SiteSetting = require('../../model/SiteSetting');
const Coupon = require('../../model/Coupon');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a human-readable string to a URL-safe slug.
 * Lowercases, replaces whitespace with hyphens, strips non-alphanumeric chars.
 * @param {string} text
 * @returns {string}
 */
const toSlug = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')       // spaces and underscores → hyphen
    .replace(/[^a-z0-9-]/g, '')    // remove any remaining non-alphanumeric
    .replace(/-+/g, '-')           // collapse consecutive hyphens
    .replace(/^-|-$/g, '');        // strip leading/trailing hyphens

const ALLOWED_BLOCK_TYPES = [
  'hero-slider',
  'featured-products',
  'category-showcase',
  'banner-grid',
  'promo-section',
  'testimonials',
  'newsletter',
  'custom-html',
  'product-carousel',
  'brand-showcase',
  'countdown-deal',
  'text-block',
  'image-gallery',
  'video-section',
];

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/pages
 * Paginated list of pages. Supports ?status= and ?search= (regex on title).
 */
exports.listPages = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const [totalItems, data] = await Promise.all([
      Page.countDocuments(filter),
      Page.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Pages retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/pages/:id
 */
exports.getPage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!page) {
      return respond.notFound(res, 'PAGE_NOT_FOUND', 'Page not found');
    }
    return respond.success(res, page, 'Page retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/pages
 */
exports.createPage = async (req, res, next) => {
  try {
    const { title, type, status, blocks, seo } = req.body;
    const slug = req.body.slug ? toSlug(req.body.slug) : toSlug(title);

    const page = new Page({
      title,
      slug,
      type,
      status: status || 'draft',
      blocks: blocks || [],
      seo: seo || {},
      createdBy: req.user._id,
    });

    await page.save();

    if (global.io) {
      global.io.emit('page:created', { id: page._id, slug: page.slug, title: page.title });
    }

    return respond.created(res, page, 'Page created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/pages/:id
 */
exports.updatePage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return respond.notFound(res, 'PAGE_NOT_FOUND', 'Page not found');
    }

    const updates = { ...req.body, updatedBy: req.user._id };

    // Auto-set publishedAt when transitioning to published
    if (
      req.body.status === 'published' &&
      page.status !== 'published' &&
      !page.publishedAt
    ) {
      updates.publishedAt = new Date();
    }

    // Prevent overwriting slug accidentally if not provided
    if (updates.slug) {
      updates.slug = toSlug(updates.slug);
    }

    const updated = await Page.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (global.io) {
      global.io.emit('page:updated', { id: updated._id, slug: updated.slug });
    }

    return respond.success(res, updated, 'Page updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/pages/:id/blocks
 * Body: { blocks: [] }
 */
exports.updatePageBlocks = async (req, res, next) => {
  try {
    const { blocks } = req.body;

    if (!Array.isArray(blocks)) {
      return respond.error(res, 'VALIDATION_ERROR', 'blocks must be an array', 400);
    }

    const invalidBlock = blocks.find(
      (b) => !b.blockType || !ALLOWED_BLOCK_TYPES.includes(b.blockType)
    );
    if (invalidBlock) {
      return respond.error(
        res,
        'INVALID_BLOCK_TYPE',
        `Block type "${invalidBlock.blockType}" is not allowed. Allowed: ${ALLOWED_BLOCK_TYPES.join(', ')}`,
        400
      );
    }

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      { blocks, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!page) {
      return respond.notFound(res, 'PAGE_NOT_FOUND', 'Page not found');
    }

    if (global.io) {
      global.io.emit('page:updated', { id: page._id, slug: page.slug });
    }

    return respond.success(res, page, 'Page blocks updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/pages/:id
 * Rejects deletion of published pages.
 */
exports.deletePage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return respond.notFound(res, 'PAGE_NOT_FOUND', 'Page not found');
    }

    if (page.status === 'published') {
      return respond.error(
        res,
        'PAGE_PUBLISHED',
        'Cannot delete a published page. Unpublish (set status to draft or archived) first.',
        400
      );
    }

    await page.deleteOne();

    if (global.io) {
      global.io.emit('page:deleted', { id: req.params.id });
    }

    return respond.success(res, null, 'Page deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/pages/:id/duplicate
 */
exports.duplicatePage = async (req, res, next) => {
  try {
    const original = await Page.findById(req.params.id);
    if (!original) {
      return respond.notFound(res, 'PAGE_NOT_FOUND', 'Page not found');
    }

    const copy = new Page({
      title: `Copy of ${original.title}`,
      slug: `${original.slug}-copy`,
      type: original.type,
      status: 'draft',
      blocks: original.blocks,
      seo: original.seo,
      createdBy: req.user._id,
    });

    await copy.save();

    if (global.io) {
      global.io.emit('page:created', { id: copy._id, slug: copy.slug, title: copy.title });
    }

    return respond.created(res, copy, 'Page duplicated successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/menus
 */
exports.listMenus = async (req, res, next) => {
  try {
    const menus = await Menu.find({}).sort({ createdAt: -1 });

    // Attach item count to each menu
    const data = menus.map((m) => {
      const obj = m.toObject();
      obj.itemCount = Array.isArray(m.items) ? m.items.length : 0;
      return obj;
    });

    return respond.success(res, data, 'Menus retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/menus/:id
 */
exports.getMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return respond.notFound(res, 'MENU_NOT_FOUND', 'Menu not found');
    }
    return respond.success(res, menu, 'Menu retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/menus
 */
exports.createMenu = async (req, res, next) => {
  try {
    const { name, location, items, status } = req.body;
    const slug = req.body.slug ? toSlug(req.body.slug) : toSlug(name);

    const menu = new Menu({
      name,
      slug,
      location,
      items: items || [],
      status: status || 'active',
    });

    await menu.save();

    if (global.io) {
      global.io.emit('menu:updated', { id: menu._id, location: menu.location });
    }

    return respond.created(res, menu, 'Menu created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/menus/:id
 */
exports.updateMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return respond.notFound(res, 'MENU_NOT_FOUND', 'Menu not found');
    }

    const updates = { ...req.body };
    if (updates.name && !updates.slug) {
      updates.slug = toSlug(updates.name);
    } else if (updates.slug) {
      updates.slug = toSlug(updates.slug);
    }

    const updated = await Menu.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (global.io) {
      global.io.emit('menu:updated', { id: updated._id, location: updated.location });
    }

    return respond.success(res, updated, 'Menu updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/menus/:id
 */
exports.deleteMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return respond.notFound(res, 'MENU_NOT_FOUND', 'Menu not found');
    }

    await menu.deleteOne();

    if (global.io) {
      global.io.emit('menu:updated', { id: req.params.id, deleted: true });
    }

    return respond.success(res, null, 'Menu deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/banners
 * Paginated. Filter by ?type= and ?status=
 */
exports.listBanners = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const [totalItems, data] = await Promise.all([
      Banner.countDocuments(filter),
      Banner.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Banners retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/banners/:id
 */
exports.getBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return respond.notFound(res, 'BANNER_NOT_FOUND', 'Banner not found');
    }
    return respond.success(res, banner, 'Banner retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/banners
 */
exports.createBanner = async (req, res, next) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();

    if (global.io) {
      global.io.emit('banner:created', { id: banner._id, type: banner.type });
    }

    return respond.created(res, banner, 'Banner created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/banners/:id
 */
exports.updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return respond.notFound(res, 'BANNER_NOT_FOUND', 'Banner not found');
    }

    if (global.io) {
      global.io.emit('banner:updated', { id: banner._id });
    }

    return respond.success(res, banner, 'Banner updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/banners/:id
 */
exports.deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return respond.notFound(res, 'BANNER_NOT_FOUND', 'Banner not found');
    }

    if (global.io) {
      global.io.emit('banner:deleted', { id: req.params.id });
    }

    return respond.success(res, null, 'Banner deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/banners/priority
 * Body: { items: [{ id, priority }] }
 */
exports.updateBannerPriority = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return respond.error(res, 'VALIDATION_ERROR', 'items must be a non-empty array', 400);
    }

    const bulkOps = items.map(({ id, priority }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { priority } },
      },
    }));

    await Banner.bulkWrite(bulkOps);

    if (global.io) {
      global.io.emit('banner:updated', { bulkPriorityUpdate: true });
    }

    return respond.success(res, null, 'Banner priorities updated successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Blog Posts
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/blog
 * Paginated. Filter by ?status=, ?category=, ?search= (text), ?author=
 */
exports.listBlogPosts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.author) filter.author = req.query.author;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [totalItems, data] = await Promise.all([
      BlogPost.countDocuments(filter),
      BlogPost.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Blog posts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/blog/:id
 */
exports.getBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'name email');
    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found');
    }
    return respond.success(res, post, 'Blog post retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/blog
 */
exports.createBlogPost = async (req, res, next) => {
  try {
    const { title } = req.body;
    const slug = req.body.slug ? toSlug(req.body.slug) : toSlug(title);

    const post = new BlogPost({
      ...req.body,
      slug,
      status: req.body.status || 'draft',
      author: req.user._id,
    });

    await post.save();

    if (global.io) {
      global.io.emit('blog:created', { id: post._id, slug: post.slug });
    }

    return respond.created(res, post, 'Blog post created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/blog/:id
 */
exports.updateBlogPost = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.slug) {
      updates.slug = toSlug(updates.slug);
    }

    const post = await BlogPost.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found');
    }

    if (global.io) {
      global.io.emit('blog:updated', { id: post._id, slug: post.slug });
    }

    return respond.success(res, post, 'Blog post updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/blog/:id
 * Rejects deletion of published posts without unpublishing first.
 */
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found');
    }

    if (post.status === 'published') {
      return respond.error(
        res,
        'BLOG_POST_PUBLISHED',
        'Cannot delete a published blog post. Unpublish it first.',
        400
      );
    }

    await post.deleteOne();

    if (global.io) {
      global.io.emit('blog:deleted', { id: req.params.id });
    }

    return respond.success(res, null, 'Blog post deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/blog/:id/publish
 */
exports.publishBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found');
    }

    if (global.io) {
      global.io.emit('blog:published', { id: post._id, slug: post.slug });
    }

    return respond.success(res, post, 'Blog post published successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/blog/:id/unpublish
 */
exports.unpublishBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { status: 'draft' },
      { new: true, runValidators: true }
    );

    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found');
    }

    if (global.io) {
      global.io.emit('blog:updated', { id: post._id, slug: post.slug, status: 'draft' });
    }

    return respond.success(res, post, 'Blog post unpublished successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Settings (singleton)
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  siteName: 'Shofy',
  siteDescription: 'Your one-stop e-commerce destination',
};

/**
 * GET /api/v1/admin/settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create(DEFAULT_SETTINGS);
    }
    return respond.success(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/settings
 * Supports dot notation for nested fields.
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await SiteSetting.findOneAndUpdate({}, req.body, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (global.io) {
      global.io.emit('settings:updated', { updatedAt: settings.updatedAt });
    }

    return respond.success(res, settings, 'Settings updated successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/coupons
 * Paginated. Filter by ?status=, ?productType=, ?search= (regex on couponCode)
 */
exports.listCoupons = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.productType) filter.productType = req.query.productType;
    if (req.query.search) {
      filter.couponCode = { $regex: req.query.search, $options: 'i' };
    }

    const [totalItems, data] = await Promise.all([
      Coupon.countDocuments(filter),
      Coupon.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Coupons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/coupons/:id
 */
exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return respond.notFound(res, 'COUPON_NOT_FOUND', 'Coupon not found');
    }
    return respond.success(res, coupon, 'Coupon retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/coupons
 * Validates that endTime > startTime.
 */
exports.createCoupon = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (!body.startTime) {
      body.startTime = new Date();
    }

    if (body.endTime && body.startTime) {
      const start = new Date(body.startTime);
      const end = new Date(body.endTime);
      if (end <= start) {
        return respond.error(
          res,
          'INVALID_DATE_RANGE',
          'endTime must be after startTime',
          400
        );
      }
    }

    const coupon = new Coupon(body);
    await coupon.save();

    if (global.io) {
      global.io.emit('coupon:created', { id: coupon._id, code: coupon.couponCode });
    }

    return respond.created(res, coupon, 'Coupon created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/coupons/:id
 */
exports.updateCoupon = async (req, res, next) => {
  try {
    // Validate date range if both dates are being updated
    const body = { ...req.body };
    if (body.startTime && body.endTime) {
      const start = new Date(body.startTime);
      const end = new Date(body.endTime);
      if (end <= start) {
        return respond.error(
          res,
          'INVALID_DATE_RANGE',
          'endTime must be after startTime',
          400
        );
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return respond.notFound(res, 'COUPON_NOT_FOUND', 'Coupon not found');
    }

    if (global.io) {
      global.io.emit('coupon:updated', { id: coupon._id, code: coupon.couponCode });
    }

    return respond.success(res, coupon, 'Coupon updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/coupons/:id
 */
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return respond.notFound(res, 'COUPON_NOT_FOUND', 'Coupon not found');
    }

    if (global.io) {
      global.io.emit('coupon:deleted', { id: req.params.id });
    }

    return respond.success(res, null, 'Coupon deleted successfully');
  } catch (err) {
    next(err);
  }
};
