import Artisan from "../models/artisan.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { buildFileUrl, deleteFile } from "../services/file.service.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

export const createArtisan = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.photo = buildFileUrl(req, req.file);

  const artisan = await Artisan.create(data);

  await createAuditLog({
    user: req.user, action: "CREATE_ARTISAN", module: "Artisan",
    targetId: artisan._id, targetName: artisan.name, req,
  });

  return successResponse(res, { artisan }, "Artisan created.", 201);
});

export const getArtisans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, region, isActive = "true", isFeatured, sort = "-createdAt" } = req.query;

  const filter = {};
  if (search)     filter.name   = { $regex: search, $options: "i" };
  if (region)     filter.region = { $regex: region, $options: "i" };
  if (isActive   !== undefined) filter.isActive   = isActive   === "true";
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

  const [artisans, total] = await Promise.all([
    Artisan.find(filter).sort(sort).skip(skip).limit(limit),
    Artisan.countDocuments(filter),
  ]);

  return paginatedResponse(res, artisans, buildPagination(page, limit, total));
});

export const getArtisanBySlug = asyncHandler(async (req, res) => {
  const artisan = await Artisan.findOne({ slug: req.params.slug, isActive: true });
  if (!artisan) return errorResponse(res, "Artisan not found.", 404);
  return successResponse(res, { artisan }, "Artisan fetched.");
});

export const updateArtisan = asyncHandler(async (req, res) => {
  const old = await Artisan.findById(req.params.id);
  if (!old) return errorResponse(res, "Artisan not found.", 404);

  const data = { ...req.body };
  if (req.file) {
    if (old.photo) deleteFile(old.photo);
    data.photo = buildFileUrl(req, req.file);
  }

  const artisan = await Artisan.findByIdAndUpdate(
    req.params.id, { $set: data }, { new: true, runValidators: true }
  );

  await createAuditLog({
    user: req.user, action: "UPDATE_ARTISAN", module: "Artisan",
    targetId: artisan._id, targetName: artisan.name, req,
  });

  return successResponse(res, { artisan }, "Artisan updated.");
});

export const deleteArtisan = asyncHandler(async (req, res) => {
  const artisan = await Artisan.findById(req.params.id);
  if (!artisan) return errorResponse(res, "Artisan not found.", 404);

  if (artisan.photo) deleteFile(artisan.photo);
  await Artisan.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_ARTISAN", module: "Artisan",
    targetId: artisan._id, targetName: artisan.name, req,
  });

  return successResponse(res, {}, "Artisan deleted.");
});
