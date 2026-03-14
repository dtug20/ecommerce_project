module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        status: "fail",
        error: "You are not authorized to access this",
      });
    }

    next();
  };
};
