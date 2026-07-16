import Blog from "../models/blog.model.js";
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

export const createBlog = asyncHandler(async (req, res) => {
  const data = { ...req.body, author: req.user._id, authorName: req.user.fullName };

  if (req.file) data.featuredImage = buildFileUrl(req, req.file);

  // Handle scheduled publishing
  if (data.status === "scheduled" && data.scheduledAt) {
    data.scheduledAt = new Date(data.scheduledAt);
  }
  if (data.status === "published" && !data.publishedAt) {
    data.publishedAt = new Date();
  }

  const blog = await Blog.create(data);

  await createAuditLog({
    user: req.user, action: "CREATE_BLOG", module: "Blog",
    targetId: blog._id, targetName: blog.title, req,
  });

  return successResponse(res, { blog }, "Blog created.", 201);
});

export const getBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const {
    search, status, category, tag,
    author, isFeatured, sort = "-publishedAt",
  } = req.query;

  const filter = {};
  if (search)     filter.$text     = { $search: search };
  if (status)     filter.status    = status;
  else            filter.status    = "published"; // default to published for public
  if (category)   filter.categories = category;
  if (tag)        filter.tags      = tag;
  if (author)     filter.author    = author;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "firstName lastName avatar")
      .select("-content") // exclude full content from list
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Blog.countDocuments(filter),
  ]);

  return paginatedResponse(res, blogs, buildPagination(page, limit, total));
});

export const getAllBlogsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, status, sort = "-createdAt" } = req.query;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (status) filter.status = status;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "firstName lastName")
      .select("title slug status publishedAt scheduledAt isFeatured viewCount readTime createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Blog.countDocuments(filter),
  ]);

  return paginatedResponse(res, blogs, buildPagination(page, limit, total));
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: "published" })
    .populate("author", "firstName lastName avatar bio");

  if (!blog) return errorResponse(res, "Blog post not found.", 404);

  // Increment views
  Blog.findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } }).exec();

  return successResponse(res, { blog }, "Blog fetched.");
});

export const updateBlog = asyncHandler(async (req, res) => {
  const old = await Blog.findById(req.params.id);
  if (!old) return errorResponse(res, "Blog not found.", 404);

  const data = { ...req.body };

  if (req.file) {
    if (old.featuredImage) deleteFile(old.featuredImage);
    data.featuredImage = buildFileUrl(req, req.file);
  }

  if (data.status === "published" && old.status !== "published") {
    data.publishedAt = new Date();
  }

  const blog = await Blog.findByIdAndUpdate(
    req.params.id, { $set: data }, { new: true, runValidators: true }
  );

  await createAuditLog({
    user: req.user, action: "UPDATE_BLOG", module: "Blog",
    targetId: blog._id, targetName: blog.title, req,
  });

  return successResponse(res, { blog }, "Blog updated.");
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return errorResponse(res, "Blog not found.", 404);

  if (blog.featuredImage) deleteFile(blog.featuredImage);
  await Blog.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_BLOG", module: "Blog",
    targetId: blog._id, targetName: blog.title, req,
  });

  return successResponse(res, {}, "Blog deleted.");
});
