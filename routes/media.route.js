import { Router } from "express";
import {
  uploadMedia,
  getMedia,
  updateMedia,
  deleteMedia,
  bulkDeleteMedia,
  getFolders,
  getStorageStats,
} from "../controllers/media.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadMedia as multerUploadMedia } from "../middleware/upload.middleware.js";

const router = Router();

router.get  ("/"        , protect, adminOnly, getMedia);
router.get  ("/folders" , protect, adminOnly, getFolders);
router.get  ("/stats"   , protect, adminOnly, getStorageStats);
router.post ("/"        , protect, adminOnly, multerUploadMedia, uploadMedia);
router.put  ("/:id"     , protect, adminOnly, updateMedia);
router.delete("/bulk"   , protect, adminOnly, bulkDeleteMedia);
router.delete("/:id"    , protect, adminOnly, deleteMedia);

export default router;
