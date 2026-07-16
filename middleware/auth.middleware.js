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
    req.user = decoded; // { id, role, email, iat, exp }

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
