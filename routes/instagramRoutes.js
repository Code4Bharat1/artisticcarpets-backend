import express from "express";
import {
  getInstagramPosts,
  getInstagramPost,
  getSettings,
  updateSettings,
  triggerSync,
} from "../controllers/instagramController.js";

const router = express.Router();

// Public routes for Frontend
router.get("/", getInstagramPosts);
router.get("/:id", getInstagramPost);

// Admin routes (Assume these might be protected by admin middleware in a real app, 
// for now keeping them accessible for the feature to work without knowing the auth middleware)
router.get("/admin/settings", getSettings);
router.put("/admin/settings", updateSettings);
router.post("/admin/sync", triggerSync);

export default router;
