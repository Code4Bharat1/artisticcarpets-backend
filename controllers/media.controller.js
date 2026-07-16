import Media from "../models/media.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import path from "path";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { buildFileUrl, deleteFile, formatFileSize } from "../services/file.service.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

// ─── Upload Media ─────────────────────────────────────────────────────────────

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    return errorResponse(res, "No files uploaded.", 400);
  }

  const { folder = "general" } = req.body;

  const uploadedFiles = await Promise.all(
    req.files.map(async (file) => {
      const url = buildFileUrl(req, file);
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

      let type = "document";
      if (file.mimetype.startsWith("image/")) type = "image";
      else if (file.mimetype.startsWith("video/")) type = "video";

      return Media.create({
        filename:     file.filename,
        originalName: file.originalname,
        url,
        mimeType:     file.mimetype,
        size:         file.size,
        format:       ext,
        type,
        folder,
        uploadedBy: req.user._id,
      });
    })
  );

  return successResponse(res, { files: uploadedFiles }, `${uploadedFiles.length} file(s) uploaded.`, 201);
});

// ─── Get Media ────────────────────────────────────────────────────────────────

export const getMedia = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, folder, type, sort = "-createdAt" } = req.query;

  const filter = { isActive: true };
  if (search) filter.$text = { $search: search };
  if (folder) filter.folder = folder;
  if (type)   filter.type   = type;

  const [files, total] = await Promise.all([
    Media.find(filter)
      .populate("uploadedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Media.countDocuments(filter),
  ]);

  return paginatedResponse(res, files, buildPagination(page, limit, total));
});

// ─── Update Media Metadata ────────────────────────────────────────────────────

export const updateMedia = asyncHandler(async (req, res) => {
  const { altText, caption, tags, folder } = req.body;

  const media = await Media.findByIdAndUpdate(
    req.params.id,
    { $set: { altText, caption, tags, folder } },
    { new: true }
  );

  if (!media) return errorResponse(res, "File not found.", 404);
  return successResponse(res, { media }, "Media updated.");
});

// ─── Delete Media ──────────────────────────────────────────────────────────────

export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) return errorResponse(res, "File not found.", 404);

  deleteFile(media.url);
  await Media.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_MEDIA", module: "Media",
    targetId: media._id, targetName: media.filename, req,
  });

  return successResponse(res, {}, "File deleted.");
});

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export const bulkDeleteMedia = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids?.length) return errorResponse(res, "No file IDs provided.", 400);

  const files = await Media.find({ _id: { $in: ids } });
  files.forEach((f) => deleteFile(f.url));

  await Media.deleteMany({ _id: { $in: ids } });

  return successResponse(res, { deletedCount: files.length }, `${files.length} file(s) deleted.`);
});

// ─── Get Folders ──────────────────────────────────────────────────────────────

export const getFolders = asyncHandler(async (req, res) => {
  const folders = await Media.distinct("folder");
  return successResponse(res, { folders }, "Folders fetched.");
});

// ─── Storage Stats ────────────────────────────────────────────────────────────

export const getStorageStats = asyncHandler(async (req, res) => {
  const stats = await Media.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalSize: { $sum: "$size" },
      },
    },
  ]);

  const total = await Media.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, count: { $sum: 1 }, totalSize: { $sum: "$size" } } },
  ]);

  return successResponse(res, {
    byType: stats,
    total: {
      count:    total[0]?.count    || 0,
      totalSize: total[0]?.totalSize || 0,
      readable: formatFileSize(total[0]?.totalSize || 0),
    },
  }, "Storage stats fetched.");
});
