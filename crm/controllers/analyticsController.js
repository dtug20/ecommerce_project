// Analytics controller — proxies to Backend API /api/v1/admin/analytics

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.getDashboard = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/analytics/dashboard');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/analytics/revenue', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/analytics/top-products', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCustomerGrowth = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/analytics/customer-growth', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/analytics/recent-orders');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
