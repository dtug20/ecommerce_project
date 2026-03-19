// CMS controller — proxies to Backend API /api/v1/admin/{pages,menus,banners,blog,settings}

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

exports.listPages = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/pages', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getPage = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/pages/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createPage = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/pages', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updatePage = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/pages/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updatePageBlocks = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/pages/${req.params.id}/blocks`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deletePage = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/pages/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.duplicatePage = async (req, res) => {
  try {
    const result = await req.api.post(`/api/v1/admin/pages/${req.params.id}/duplicate`, {});
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

exports.listMenus = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/menus', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getMenu = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/menus/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createMenu = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/menus', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/menus/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/menus/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

exports.listBanners = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/banners', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getBanner = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/banners/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createBanner = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/banners', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/banners/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/banners/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateBannerPriority = async (req, res) => {
  try {
    const result = await req.api.patch('/api/v1/admin/banners/priority', req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

exports.listBlogPosts = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/blog', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getBlogPost = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/blog/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createBlogPost = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/blog', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateBlogPost = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/blog/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteBlogPost = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/blog/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.publishBlogPost = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/blog/${req.params.id}/publish`, {});
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.unpublishBlogPost = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/blog/${req.params.id}/unpublish`, {});
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

exports.getSettings = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/settings');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const result = await req.api.patch('/api/v1/admin/settings', req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
