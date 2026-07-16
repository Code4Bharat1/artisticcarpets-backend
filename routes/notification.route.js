import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get   ("/"              , protect, getNotifications);
router.get   ("/unread-count"  , protect, getUnreadCount);
router.patch ("/read-all"      , protect, markAllAsRead);
router.patch ("/:id/read"      , protect, markAsRead);
router.delete("/:id"           , protect, deleteNotification);

export default router;
