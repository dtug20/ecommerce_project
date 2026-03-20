// Activity Log controller — proxies to Backend API /api/v1/admin/activity-log

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listLogs = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/activity-log', req.query);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.exportCsv = async (req, res) => {
  try {
    // Stream the CSV export from the backend directly
    const ApiProxy = require('../services/apiProxy');
    const proxy = new ApiProxy(req);
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7001';
    const axios = require('axios');
    const token = req.kauth?.grant?.access_token?.token || null;

    const queryString = new URLSearchParams(req.query).toString();
    const url = `${backendUrl}/api/v1/admin/activity-log/export${queryString ? `?${queryString}` : ''}`;

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-log.csv"');
    response.data.pipe(res);
  } catch (error) {
    handleError(res, error);
  }
};
