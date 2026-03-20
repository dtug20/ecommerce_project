// Email Template controller — proxies to Backend API /api/v1/admin/email-templates

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  const data = error.response?.data || { success: false, message: error.message };
  res.status(status).json(data);
};

exports.listTemplates = async (req, res) => {
  try {
    const result = await req.api.get('/api/v1/admin/email-templates');
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const result = await req.api.get(`/api/v1/admin/email-templates/${req.params.id}`);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const result = await req.api.patch(`/api/v1/admin/email-templates/${req.params.id}`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.previewTemplate = async (req, res) => {
  try {
    const result = await req.api.post(`/api/v1/admin/email-templates/${req.params.id}/preview`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const result = await req.api.post(`/api/v1/admin/email-templates/${req.params.id}/test`, req.body);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
