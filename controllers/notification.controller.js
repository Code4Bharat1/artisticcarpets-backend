import Notification from "../models/notification.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { isRead } = req.query;

  const filter = { recipient: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === "true";

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort("-createdAt").skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return paginatedResponse(res, notifications, buildPagination(page, limit, total), "Notifications fetched.");
});

export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() }
  );
  return successResponse(res, {}, "Notification marked as read.");
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return successResponse(res, {}, "All notifications marked as read.");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  return successResponse(res, {}, "Notification deleted.");
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  return successResponse(res, { count }, "Unread count fetched.");
});

// Internal helper — create a notification (used by other controllers)
export const createNotification = async ({ recipient, type, title, message, data, link }) => {
  try {
    await Notification.create({ recipient, type, title, message, data, link });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
};
