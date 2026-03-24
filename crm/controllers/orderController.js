// Order controller — proxies to Backend API /api/v1/admin/orders

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.getAllOrders = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/orders', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/orders/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/orders', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/orders/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/orders/${req.params.id}/status`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.takeOrder = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/orders/${req.params.id}/take`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/orders/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/orders/stats');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
