// User controller — proxies to Backend API /api/admin/users

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await req.api.get('/api/admin/users', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const result = await req.api.get(`/api/admin/users/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const result = await req.api.post('/api/admin/users', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/admin/users/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/admin/users/${req.params.id}/status`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/admin/users/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const result = await req.api.get('/api/admin/users/stats');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const result = await req.api.get(`/api/admin/users/${req.params.id}/orders`, req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
