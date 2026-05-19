'use strict';

/**
 * Store CMS Controller — v1
 *
 * Public read-only endpoints that serve CMS content to the storefront.
 * No authentication required. Only published / active content is exposed.
 */

const Banner = require('../../model/Banner');
const BlogPost = require('../../model/BlogPost');
const SiteSetting = require('../../model/SiteSetting');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/banners
 * Query params: ?type=, ?page= (targeting page slug)
 * Returns banners that are:
 *   - status: "active"
 *   - scheduling: isAlwaysActive OR (startDate <= now <= endDate)
 *   - targeting: pages is empty OR contains the requested page slug
 * Sorted by priority descending.
 */
exports.getActiveBanners = async (req, res, next) => {
  try {
    const now = new Date();
    const requestedPage = req.query.page || null;

    const filter = {
      status: 'active',
      $or: [
        { 'scheduling.isAlwaysActive': true },
        {
          'scheduling.startDate': { $lte: now },
          'scheduling.endDate': { $gte: now },
        },
      ],
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (requestedPage) {
      filter.$and = [
        {
          $or: [
            { 'targeting.pages': { $size: 0 } },
            { 'targeting.pages': requestedPage },
          ],
        },
      ];
    }

    const banners = await Banner.find(filter).sort({ priority: -1 });

    return respond.success(res, banners, 'Banners retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/blog
 * Paginated list of published blog posts.
 * Filter: ?category=, ?tag=, ?featured=true|false
 * Sort by publishedAt desc.
 */
exports.listPublishedBlogPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { status: 'published' };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === 'true';
    }

    const [totalItems, data] = await Promise.all([
      BlogPost.countDocuments(filter),
      BlogPost.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Blog posts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/blog/featured
 * Returns up to 6 featured published blog posts, sorted by publishedAt desc.
 */
exports.getFeaturedBlogPosts = async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ featured: true, status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(6)
      .populate('author', 'name');

    return respond.success(res, posts, 'Featured blog posts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/blog/:slug
 * Returns a single published blog post by slug.
 * Increments views counter fire-and-forget.
 */
exports.getBlogPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: 'published',
    }).populate('author', 'name');

    if (!post) {
      return respond.notFound(res, 'BLOG_POST_NOT_FOUND', 'Blog post not found or not published');
    }

    // Increment views counter fire-and-forget (do not await)
    BlogPost.updateOne({ slug: req.params.slug }, { $inc: { views: 1 } }).catch(() => {});

    return respond.success(res, post, 'Blog post retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Settings (public subset only)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/settings
 * Returns only the public-safe fields from SiteSetting.
 * Excludes: payment internals, maintenance config, shipping internals, i18n internals.
 */
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SiteSetting.findOne(
      {},
      {
        siteName: 1,
        siteDescription: 1,
        logo: 1,
        favicon: 1,
        ogImage: 1,
        theme: 1,
        contact: 1,
        seo: 1,
      }
    );

    if (!settings) {
      // Return safe defaults when no settings document exists yet
      return respond.success(
        res,
        {
          siteName: 'Shofy',
          siteDescription: '',
          logo: null,
          favicon: null,
          ogImage: null,
          theme: {},
          contact: {},
          seo: {},
        },
        'Settings retrieved successfully'
      );
    }

    return respond.success(res, settings, 'Settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};
