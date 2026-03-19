// Category controller — proxies to Backend API /api/v1/admin/categories

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.getAllCategories = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/categories', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/categories/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createCategory = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/categories', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/categories/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/categories/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCategoryTree = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/categories/tree');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCategoryStats = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/categories/stats');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
