import Gallery from "../models/gallery.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse, paginatedResponse, parsePagination, buildPagination } from "../utils/apiResponse.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

// @desc    Get all gallery posts (Admin & Public)
// @route   GET /api/gallery
// @access  Public
export const getGalleries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  
  let query = {};
  
  // If not admin, only show published
  if (!req.user || req.user.role !== "admin") {
    query.status = "published";
  }

  // Filters
  if (req.query.category && req.query.category !== "All") {
    query.category = req.query.category;
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { shortDescription: { $regex: req.query.search, $options: "i" } },
      { clientName: { $regex: req.query.search, $options: "i" } },
      { location: { $regex: req.query.search, $options: "i" } },
    ];
  }
  if (req.query.status && req.user?.role === "admin") {
    query.status = req.query.status;
  }
  if (req.query.isFeatured === "true") {
    query.isFeatured = true;
  }

  // Sorting
  let sort = { displayOrder: 1, createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case "latest": sort = { createdAt: -1 }; break;
      case "oldest": sort = { createdAt: 1 }; break;
      case "most_viewed": sort = { viewCount: -1 }; break;
      case "featured": sort = { isFeatured: -1, displayOrder: 1 }; break;
    }
  }

  const [galleries, total] = await Promise.all([
    Gallery.find(query).sort(sort).skip(skip).limit(limit),
    Gallery.countDocuments(query),
  ]);

  const pagination = buildPagination(page, limit, total);
  return paginatedResponse(res, galleries, pagination, "Gallery posts fetched");
});

// @desc    Get gallery post by ID or Slug
// @route   GET /api/gallery/:id
// @access  Public
export const getGallery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let gallery;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    gallery = await Gallery.findById(id);
  } else {
    gallery = await Gallery.findOne({ slug: id });
  }

  if (!gallery) return errorResponse(res, "Gallery post not found", 404);
  
  // If public user accessing a draft, block
  if (gallery.status !== "published" && (!req.user || req.user.role !== "admin")) {
    return errorResponse(res, "Gallery post not found", 404);
  }

  return successResponse(res, { gallery }, "Gallery post fetched");
});

// @desc    Create new gallery post
// @route   POST /api/gallery
// @access  Private/Admin
export const createGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.create(req.body);
  
  await createAuditLog({
    user: req.user,
    action: "CREATE_GALLERY",
    module: "Gallery",
    targetId: gallery._id,
    targetName: gallery.title,
    req,
  });

  return successResponse(res, { gallery }, "Gallery post created successfully", 201);
});

// @desc    Update gallery post
// @route   PATCH /api/gallery/:id
// @access  Private/Admin
export const updateGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!gallery) return errorResponse(res, "Gallery post not found", 404);

  await createAuditLog({
    user: req.user,
    action: "UPDATE_GALLERY",
    module: "Gallery",
    targetId: gallery._id,
    targetName: gallery.title,
    req,
  });

  return successResponse(res, { gallery }, "Gallery post updated");
});

// @desc    Delete gallery post
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
export const deleteGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findByIdAndDelete(req.params.id);
  
  if (!gallery) return errorResponse(res, "Gallery post not found", 404);

  await createAuditLog({
    user: req.user,
    action: "DELETE_GALLERY",
    module: "Gallery",
    targetId: gallery._id,
    targetName: gallery.title,
    req,
  });

  return successResponse(res, null, "Gallery post deleted");
});

// @desc    Like gallery post
// @route   POST /api/gallery/:id/like
// @access  Public
export const likeGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findById(req.params.id);
  if (!gallery) return errorResponse(res, "Gallery post not found", 404);
  
  gallery.likeCount += 1;
  await gallery.save();
  
  return successResponse(res, { likeCount: gallery.likeCount }, "Gallery post liked");
});

// @desc    Increment view count
// @route   POST /api/gallery/:id/view
// @access  Public
export const viewGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findById(req.params.id);
  if (!gallery) return errorResponse(res, "Gallery post not found", 404);
  
  gallery.viewCount += 1;
  await gallery.save();
  
  return successResponse(res, { viewCount: gallery.viewCount }, "View count updated");
});
