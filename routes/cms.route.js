import { Router } from "express";
import {
  getPage,
  getAllPages,
  upsertPage,
  deletePage,
} from "../controllers/cms.controller.js";
import { protect, adminOnly, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// Public
router.get("/:pageKey", getPage);

// Admin
router.get   ("/",           protect, adminOnly, getAllPages);
router.put   ("/:pageKey",   protect, authorize("admin","super_admin","content_manager","manager"), upsertPage);
router.delete("/:pageKey",   protect, adminOnly, deletePage);

export default router;
