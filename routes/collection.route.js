import { Router } from "express";
import {
  createCollection,
  getCollections,
  getCollectionBySlug,
  updateCollection,
  deleteCollection,
} from "../controllers/collection.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import { FOLDERS } from "../middleware/upload.middleware.js";

// Collection-specific multer (image + banner)
const collectionUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOLDERS.collections),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${file.fieldname}-${Date.now()}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: "image",       maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
]);

const router = Router();

router.get ("/",        getCollections);
router.get ("/:slug",   getCollectionBySlug);

router.post  ("/",      protect, adminOnly, collectionUpload, createCollection);
router.put   ("/:id",   protect, adminOnly, collectionUpload, updateCollection);
router.delete("/:id",   protect, adminOnly, deleteCollection);

export default router;
