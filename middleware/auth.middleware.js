import jwt from "jsonwebtoken";
import { sendError } from "../utils/helpers.js";

/**
 * Verify JWT token from the Authorization header.
 * Attaches the decoded user payload to req.user.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize: JWT payload uses `id`, but controllers expect `_id`
    req.user = { ...decoded, _id: decoded.id }; // { id, _id, role, iat, exp }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired. Please log in again.");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token.");
    }
    return sendError(res, 500, "Authentication error.");
  }
};

/**
 * Allow only admin-level roles.
 * Must be used AFTER protect.
 */
const ADMIN_ROLES = ["admin", "super_admin", "manager", "inventory_manager", "sales_manager", "content_manager", "support_executive"];

export const adminOnly = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return sendError(res, 403, "Access denied. Admins only.");
  }
  next();
};

/**
 * Allow only specific roles.
 * Usage: authorize("super_admin", "admin")
 * Must be used AFTER protect.
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 403, `Access denied. Required role(s): ${roles.join(", ")}.`);
  }
  next();
};

/**
 * Optionally attach req.user if a valid token is present.
 * Does NOT block the request if no token is provided.
 * Useful for public routes that behave differently for logged-in users.
 */
export const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { ...decoded, _id: decoded.id };
    }
  } catch {
    // invalid / expired token — treat as unauthenticated
    req.user = null;
  }
  next();
};
