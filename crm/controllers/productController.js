// Product controller — proxies to Backend API /api/v1/admin/products

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.getAllProducts = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/products', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/products/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/products', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/products/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/products/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/products/stats');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
