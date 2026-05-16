// Chatbot controller — proxies to Backend API /api/v1/admin/chat/*

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listSessions = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/chat/sessions', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/chat/analytics');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
