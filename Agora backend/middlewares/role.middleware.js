// middlewares/role.middleware.js

/**
 * authorizeRoles - Role-Based Access Control Gate
 *
 * Usage: authorizeRoles("admin")  or  authorizeRoles("admin", "moderator")
 *
 * This middleware MUST be placed AFTER authMiddleware in any route chain,
 * because it depends on req.user being populated by authMiddleware first.
 *
 * If the authenticated user's role is not in the allowed list,
 * the request is terminated with 403 Forbidden before reaching the controller.
 */

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is guaranteed to exist here because authMiddleware ran first
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires one of the following roles: [${allowedRoles.join(", ")}].`,
      });
    }
    next();
  };
};

