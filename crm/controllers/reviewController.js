// Review controller — proxies to Backend API /api/v1/admin/reviews

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listReviews = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/reviews', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getReview = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/reviews/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.approveReview = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/reviews/${req.params.id}/approve`, {});
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.rejectReview = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/reviews/${req.params.id}/reject`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.replyToReview = async (req, res) => {
  try {
    const result = await req.api.post(`/api/v1/admin/reviews/${req.params.id}/reply`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const result = await req.api.delete(`/api/v1/admin/reviews/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
