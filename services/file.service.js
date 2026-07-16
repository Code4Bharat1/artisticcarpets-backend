import fs from "fs";
import path from "path";
import { UPLOAD_ROOT } from "../middleware/upload.middleware.js";

/**
 * Delete a file from the uploads directory.
 * Accepts either a full absolute path or a URL like /uploads/products/file.jpg
 */
export const deleteFile = (filePath) => {
  try {
    // If it's a URL path, convert to absolute
    let absPath = filePath;
    if (filePath.startsWith("/uploads/")) {
      absPath = path.join(UPLOAD_ROOT, filePath.replace("/uploads/", ""));
    }
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("File delete error:", err.message);
    return false;
  }
};

/**
 * Delete multiple files
 */
export const deleteFiles = (filePaths = []) => {
  return filePaths.map((fp) => deleteFile(fp));
};

/**
 * Build a public URL from a multer file object and the request
 */
export const buildFileUrl = (req, multerFile) => {
  if (!multerFile) return null;
  const relative = path.relative(UPLOAD_ROOT, multerFile.path).replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/uploads/${relative}`;
};

/**
 * Build public URLs from an array of multer file objects
 */
export const buildFileUrls = (req, multerFiles = []) => {
  return multerFiles.map((f) => buildFileUrl(req, f));
};

/**
 * Get file size in a human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
