import express from "express";
import { protect, adminOnly, optionalAuth } from "../middleware/auth.middleware.js";
import {
  getGalleries,
  getGallery,
  createGallery,
  updateGallery,
  deleteGallery,
  likeGallery,
  viewGallery
} from "../controllers/gallery.controller.js";

const router = express.Router();

// Public routes
router.get("/", optionalAuth, getGalleries);
router.get("/:id", optionalAuth, getGallery);
router.post("/:id/like", likeGallery);
router.post("/:id/view", viewGallery);

// Admin routes
router.post("/", protect, adminOnly, createGallery);
router.patch("/:id", protect, adminOnly, updateGallery);
router.delete("/:id", protect, adminOnly, deleteGallery);

export default router;
