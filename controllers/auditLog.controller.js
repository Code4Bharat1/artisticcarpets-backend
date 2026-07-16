import AuditLog from "../models/auditLog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { userId, module, action, startDate, endDate, sort = "-createdAt" } = req.query;

  const filter = {};
  if (userId)    filter.user   = userId;
  if (module)    filter.module = module;
  if (action)    filter.action = action;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("user", "firstName lastName email role")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return paginatedResponse(res, logs, buildPagination(page, limit, total), "Audit logs fetched.");
});
