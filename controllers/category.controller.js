import Category from "../models/category.model.js";
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

export const createCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = buildFileUrl(req, req.file);

  const category = await Category.create(data);

  await createAuditLog({
    user: req.user, action: "CREATE_CATEGORY", module: "Category",
    targetId: category._id, targetName: category.name, req,
  });

  return successResponse(res, { category }, "Category created.", 201);
});

export const getCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, parent, isActive, sort = "sortOrder name" } = req.query;

  const filter = {};
  if (search)   filter.name     = { $regex: search, $options: "i" };
  if (parent)   filter.parent   = parent === "null" ? null : parent;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("parent", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Category.countDocuments(filter),
  ]);

  return paginatedResponse(res, categories, buildPagination(page, limit, total));
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate("parent", "name slug");
  if (!category) return errorResponse(res, "Category not found.", 404);
  return successResponse(res, { category }, "Category fetched.");
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    // Delete old image
    const old = await Category.findById(req.params.id);
    if (old?.image) deleteFile(old.image);
    data.image = buildFileUrl(req, req.file);
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id, { $set: data }, { new: true, runValidators: true }
  );
  if (!category) return errorResponse(res, "Category not found.", 404);

  await createAuditLog({
    user: req.user, action: "UPDATE_CATEGORY", module: "Category",
    targetId: category._id, targetName: category.name, req,
  });

  return successResponse(res, { category }, "Category updated.");
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return errorResponse(res, "Category not found.", 404);

  if (category.image) deleteFile(category.image);
  await Category.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_CATEGORY", module: "Category",
    targetId: category._id, targetName: category.name, req,
  });

  return successResponse(res, {}, "Category deleted.");
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort("sortOrder name").lean();

  // Build tree
  const map = {};
  categories.forEach((c) => { map[c._id] = { ...c, children: [] }; });

  const tree = [];
  categories.forEach((c) => {
    if (c.parent) {
      map[c.parent]?.children.push(map[c._id]);
    } else {
      tree.push(map[c._id]);
    }
  });

  return successResponse(res, { tree }, "Category tree fetched.");
});
