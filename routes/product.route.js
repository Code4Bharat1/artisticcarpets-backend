import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct,
  bulkUpdateProducts,
  deleteProductImage,
  getProductStats,
} from "../controllers/product.controller.js";
import { protect, adminOnly, optionalAuth } from "../middleware/auth.middleware.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";

const router = Router();

// Public
router.get("/",              optionalAuth, getProducts);
router.get("/slug/:slug",    optionalAuth, getProductBySlug);

// Admin
router.get  ("/stats",       protect, adminOnly, getProductStats);
router.get  ("/:id",         protect, adminOnly, getProductById);

router.post (
  "/",
  protect, adminOnly,
  uploadProductImages,
  createProduct
);

router.put(
  "/:id",
  protect, adminOnly,
  uploadProductImages,
  updateProduct
);

router.delete("/:id",               protect, adminOnly, deleteProduct);
router.patch ("/:id/archive",       protect, adminOnly, archiveProduct);
router.patch ("/:id/restore",       protect, adminOnly, restoreProduct);
router.post  ("/bulk",              protect, adminOnly, bulkUpdateProducts);
router.delete("/:id/images",        protect, adminOnly, deleteProductImage);

export default router;
