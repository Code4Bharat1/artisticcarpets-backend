import AuditLog from "../models/auditLog.model.js";

/**
 * Create an audit log entry
 */
export const createAuditLog = async ({
  user,
  action,
  module,
  targetId = null,
  targetName = null,
  changes = null,
  description = null,
  req = null,
}) => {
  try {
    await AuditLog.create({
      user: user?._id || user,
      userName: user?.fullName || user?.email || null,
      action,
      module,
      targetId,
      targetName,
      changes,
      description,
      ip: req ? (req.ip || req.headers["x-forwarded-for"] || "unknown") : null,
      userAgent: req ? req.headers["user-agent"] : null,
      method: req?.method,
      path: req?.originalUrl,
    });
  } catch (err) {
    // Audit log errors should never break the main flow
    console.error("AuditLog Error:", err.message);
  }
};
