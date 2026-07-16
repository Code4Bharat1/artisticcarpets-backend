import { Router } from "express";
import {
  createArtisan,
  getArtisans,
  getArtisanBySlug,
  updateArtisan,
  deleteArtisan,
} from "../controllers/artisan.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const router = Router();

router.get ("/"       , getArtisans);
router.get ("/:slug"  , getArtisanBySlug);

router.post  ("/"     , protect, adminOnly, uploadSingleImage("artisans"), createArtisan);
router.put   ("/:id"  , protect, adminOnly, uploadSingleImage("artisans"), updateArtisan);
router.delete("/:id"  , protect, adminOnly, deleteArtisan);

export default router;
