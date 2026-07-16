import { Router } from "express";
import {
  createBlog,
  getBlogs,
  getAllBlogsAdmin,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller.js";
import { protect, adminOnly, authorize } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const router = Router();

// Public
router.get("/",        getBlogs);
router.get("/:slug",   getBlogBySlug);

// Admin
router.get  ("/admin/all", protect, adminOnly, getAllBlogsAdmin);
router.post (
  "/",
  protect,
  authorize("admin", "super_admin", "content_manager", "manager"),
  uploadSingleImage("blogs"),
  createBlog
);
router.put(
  "/:id",
  protect,
  authorize("admin", "super_admin", "content_manager", "manager"),
  uploadSingleImage("blogs"),
  updateBlog
);
router.delete("/:id", protect, adminOnly, deleteBlog);

export default router;
