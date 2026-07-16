import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { sendError } from "../utils/helpers.js";

// ─────────────────────────────────────────────
// Disk storage engine — saves files to
// uploads/products/  with a unique filename.
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/products/");
  },

  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = uuidv4().split("-")[0]; // short random segment
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_") // sanitise unsafe chars
      .slice(0, 50); // cap length

    cb(null, `${timestamp}-${random}-${safeName}${ext}`);
  },
});

// ─────────────────────────────────────────────
// MIME-type filter — only allow image formats
// ─────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported file type: ${file.mimetype}. Only jpg, jpeg, png, webp are allowed.`
      ),
      false
    );
  }
};

// ─────────────────────────────────────────────
// Multer instance — 5 MB per file hard limit
// ─────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ─────────────────────────────────────────────
// Upload fields:
//   thumbnail → max 1 file
//   images    → max 10 files
// ─────────────────────────────────────────────
export const uploadProductImages = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// ─────────────────────────────────────────────
// Multer error-handling middleware.
// Converts MulterError instances into clean JSON.
// Must be used AFTER uploadProductImages in routes.
// ─────────────────────────────────────────────
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 400, "File size exceeds the 5 MB limit.");
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return sendError(res, 400, "Too many files uploaded.");
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendError(res, 400, err.field || "Unexpected file field.");
    }
    return sendError(res, 400, err.message);
  }
  next(err);
};
