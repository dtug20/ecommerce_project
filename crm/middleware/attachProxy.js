const ApiProxy = require('../services/apiProxy');

module.exports = (req, res, next) => {
  req.api = new ApiProxy(req);
  next();
};
