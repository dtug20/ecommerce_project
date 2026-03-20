// Vendor controller — proxies to Backend API /api/v1/admin/vendors

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listVendors = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/vendors', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getVendorStats = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/vendors/stats');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getVendor = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/vendors/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getVendorProducts = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/vendors/${req.params.id}/products`, req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getVendorOrders = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/vendors/${req.params.id}/orders`, req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getVendorPayouts = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/vendors/${req.params.id}/payouts`, req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.approveVendor = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/vendors/${req.params.id}/approve`, {});
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.rejectVendor = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/vendors/${req.params.id}/reject`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.suspendVendor = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/vendors/${req.params.id}/suspend`, {});
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateCommission = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/vendors/${req.params.id}/commission`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.processPayout = async (req, res) => {
  try {
    const result = await req.api.post(
      `/api/v1/admin/vendors/${req.params.id}/payouts/${req.params.payoutId}/process`,
      req.body
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
