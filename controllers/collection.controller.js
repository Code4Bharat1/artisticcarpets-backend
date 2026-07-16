import Collection from "../models/collection.model.js";
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

export const createCollection = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.files?.image?.[0])       data.image       = buildFileUrl(req, req.files.image[0]);
  if (req.files?.bannerImage?.[0]) data.bannerImage = buildFileUrl(req, req.files.bannerImage[0]);

  const collection = await Collection.create(data);

  await createAuditLog({
    user: req.user, action: "CREATE_COLLECTION", module: "Collection",
    targetId: collection._id, targetName: collection.name, req,
  });

  return successResponse(res, { collection }, "Collection created.", 201);
});

export const getCollections = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, type, isFeatured, isActive = "true", sort = "sortOrder name" } = req.query;

  const filter = {};
  if (search)     filter.name  = { $regex: search, $options: "i" };
  if (type)       filter.type  = type;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
  if (isActive   !== undefined) filter.isActive   = isActive   === "true";

  const [collections, total] = await Promise.all([
    Collection.find(filter).sort(sort).skip(skip).limit(limit),
    Collection.countDocuments(filter),
  ]);

  return paginatedResponse(res, collections, buildPagination(page, limit, total));
});

export const getCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.slug, isActive: true });
  if (!collection) return errorResponse(res, "Collection not found.", 404);
  return successResponse(res, { collection }, "Collection fetched.");
});

export const updateCollection = asyncHandler(async (req, res) => {
  const old = await Collection.findById(req.params.id);
  if (!old) return errorResponse(res, "Collection not found.", 404);

  const data = { ...req.body };
  if (req.files?.image?.[0]) {
    if (old.image) deleteFile(old.image);
    data.image = buildFileUrl(req, req.files.image[0]);
  }
  if (req.files?.bannerImage?.[0]) {
    if (old.bannerImage) deleteFile(old.bannerImage);
    data.bannerImage = buildFileUrl(req, req.files.bannerImage[0]);
  }

  const collection = await Collection.findByIdAndUpdate(
    req.params.id, { $set: data }, { new: true, runValidators: true }
  );

  await createAuditLog({
    user: req.user, action: "UPDATE_COLLECTION", module: "Collection",
    targetId: collection._id, targetName: collection.name, req,
  });

  return successResponse(res, { collection }, "Collection updated.");
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) return errorResponse(res, "Collection not found.", 404);

  if (collection.image)       deleteFile(collection.image);
  if (collection.bannerImage) deleteFile(collection.bannerImage);

  await Collection.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_COLLECTION", module: "Collection",
    targetId: collection._id, targetName: collection.name, req,
  });

  return successResponse(res, {}, "Collection deleted.");
});
