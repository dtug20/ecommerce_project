// Coupon controller — proxies to Backend API /api/v1/admin/coupons

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listCoupons = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/coupons', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCoupon = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/coupons/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const result = await req.api.post('/api/v1/admin/coupons', req.body);
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/coupons/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/coupons/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
