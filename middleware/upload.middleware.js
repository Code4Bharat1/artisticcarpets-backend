import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { sendError } from "../utils/helpers.js";

// ─────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the uploads root — used by file.service.js */
export const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");

/** Named folder constants used by route files */
export const FOLDERS = {
  products:    "products",
  avatars:     "avatars",
  media:       "media",
  categories:  "categories",
  collections: "collections",
  blogs:       "blogs",
  artisans:    "artisans",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Ensure a subdirectory under UPLOAD_ROOT exists */
const ensureDir = (folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/** Build a unique filename preserving the original extension */
const buildFilename = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const safe = path
    .basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 50);
  return `${Date.now()}-${uuidv4().split("-")[0]}-${safe}${ext}`;
};

// ─────────────────────────────────────────────
// Storage factory — writes to uploads/<folder>/
// ─────────────────────────────────────────────
const makeStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ensureDir(folder)),
    filename:    (_req, file,  cb) => cb(null, buildFilename(file)),
  });

// ─────────────────────────────────────────────
// MIME-type filter — images only
// ─────────────────────────────────────────────
const imageFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported type: ${file.mimetype}. Allowed: jpg, jpeg, png, webp.`
      ),
      false
    );
  }
};

// ─────────────────────────────────────────────
// Multer instances per upload type
// ─────────────────────────────────────────────
const limits5MB  = { fileSize: 5 * 1024 * 1024 };
const limits2MB  = { fileSize: 2 * 1024 * 1024 };
const limits10MB = { fileSize: 10 * 1024 * 1024 };

/**
 * Product images — thumbnail (×1) + images (×10)
 * Used by: product routes
 */
export const uploadProductImages = multer({
  storage:    makeStorage(FOLDERS.products),
  fileFilter: imageFilter,
  limits:     limits5MB,
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images",    maxCount: 10 },
]);

/**
 * Avatar — single file field "avatar"
 * Used by: user routes
 */
export const uploadAvatar = multer({
  storage:    makeStorage(FOLDERS.avatars),
  fileFilter: imageFilter,
  limits:     limits2MB,
}).single("avatar");

/**
 * Media library — single file field "file", up to 10 MB
 * Used by: media routes
 */
export const uploadMedia = multer({
  storage:    makeStorage(FOLDERS.media),
  fileFilter: imageFilter,
  limits:     limits10MB,
}).single("file");

/**
 * Generic single image factory — field "image"
 * Usage: uploadSingleImage("categories") | uploadSingleImage("blogs") | etc.
 * Used by: category, collection, blog, artisan routes
 */
export const uploadSingleImage = (folder) =>
  multer({
    storage:    makeStorage(folder),
    fileFilter: imageFilter,
    limits:     limits5MB,
  }).single("image");

// ─────────────────────────────────────────────
// Error handler — use AFTER any upload middleware
// ─────────────────────────────────────────────
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return sendError(res, 400, "File size exceeds the limit.");
    if (err.code === "LIMIT_FILE_COUNT")
      return sendError(res, 400, "Too many files uploaded.");
    if (err.code === "LIMIT_UNEXPECTED_FILE")
      return sendError(res, 400, err.field || "Unexpected file field.");
    return sendError(res, 400, err.message);
  }
  next(err);
};
