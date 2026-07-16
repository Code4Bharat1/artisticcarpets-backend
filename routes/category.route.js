import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from "../controllers/category.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const router = Router();

router.get ("/tree",       getCategoryTree);
router.get ("/",           getCategories);
router.get ("/:slug",      getCategoryBySlug);

router.post   ("/",        protect, adminOnly, uploadSingleImage("categories"), createCategory);
router.put    ("/:id",     protect, adminOnly, uploadSingleImage("categories"), updateCategory);
router.delete ("/:id",     protect, adminOnly, deleteCategory);

export default router;
