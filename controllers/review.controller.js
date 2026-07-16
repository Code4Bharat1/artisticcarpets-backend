import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { buildFileUrls } from "../services/file.service.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

// ─── Create Review ─────────────────────────────────────────────────────────────

export const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, title, body } = req.body;

  // Check if user already reviewed this product
  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) return errorResponse(res, "You have already reviewed this product.", 409);

  // Check verified purchase
  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
      status: "delivered",
      "items.product": productId,
    });
    isVerifiedPurchase = !!order;
  }

  const data = {
    product: productId,
    user: req.user._id,
    order: orderId,
    rating: Number(rating),
    title,
    body,
    isVerifiedPurchase,
    status: "pending",
  };

  if (req.files?.length) {
    data.photos = buildFileUrls(req, req.files);
  }

  const review = await Review.create(data);

  return successResponse(res, { review }, "Review submitted. It will be visible after approval.", 201);
});

// ─── Get Reviews for a Product ────────────────────────────────────────────────

export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { rating, sort = "-createdAt" } = req.query;

  const filter = { product: req.params.productId, status: "approved" };
  if (rating) filter.rating = Number(rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "firstName lastName avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  // Rating distribution
  const distribution = await Review.aggregate([
    { $match: { product: reviews[0]?.product || null, status: "approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  return paginatedResponse(res, reviews, buildPagination(page, limit, total), "Reviews fetched.");
});

// ─── Admin: Get All Reviews ────────────────────────────────────────────────────

export const getReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status, rating, isReported, search, sort = "-createdAt" } = req.query;

  const filter = {};
  if (status)     filter.status     = status;
  if (rating)     filter.rating     = Number(rating);
  if (isReported !== undefined) filter.isReported = isReported === "true";

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user",    "firstName lastName email avatar")
      .populate("product", "name mainImage slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return paginatedResponse(res, reviews, buildPagination(page, limit, total));
});

// ─── Admin: Approve / Reject Review ──────────────────────────────────────────

export const moderateReview = asyncHandler(async (req, res) => {
  const { action } = req.body; // "approve" | "reject"

  const review = await Review.findById(req.params.id);
  if (!review) return errorResponse(res, "Review not found.", 404);

  review.status = action === "approve" ? "approved" : "rejected";
  await review.save(); // post-save hook updates product rating

  await createAuditLog({
    user: req.user, action: `${action.toUpperCase()}_REVIEW`, module: "Review",
    targetId: review._id, req,
  });

  return successResponse(res, { review }, `Review ${action}d.`);
});

// ─── Admin: Reply to Review ───────────────────────────────────────────────────

export const replyToReview = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      reply: {
        message,
        repliedBy: req.user._id,
        repliedAt: new Date(),
      },
    },
    { new: true }
  ).populate("user", "firstName lastName");

  if (!review) return errorResponse(res, "Review not found.", 404);

  return successResponse(res, { review }, "Reply added.");
});

// ─── Report Review (Customer) ─────────────────────────────────────────────────

export const reportReview = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  await Review.findByIdAndUpdate(req.params.id, {
    isReported: true,
    reportReason: reason,
    reportedBy: req.user._id,
  });

  return successResponse(res, {}, "Review reported for moderation.");
});

// ─── Helpful Vote ─────────────────────────────────────────────────────────────

export const voteHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return errorResponse(res, "Review not found.", 404);

  const alreadyVoted = review.helpfulVotes.includes(req.user._id);
  if (alreadyVoted) {
    review.helpfulVotes.pull(req.user._id);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulVotes.push(req.user._id);
    review.helpfulCount += 1;
  }

  await review.save();
  return successResponse(res, { helpful: !alreadyVoted, helpfulCount: review.helpfulCount }, "Vote recorded.");
});

// ─── Review Stats ─────────────────────────────────────────────────────────────

export const getReviewStats = asyncHandler(async (req, res) => {
  const [pending, approved, rejected, reported, photoReviews] = await Promise.all([
    Review.countDocuments({ status: "pending" }),
    Review.countDocuments({ status: "approved" }),
    Review.countDocuments({ status: "rejected" }),
    Review.countDocuments({ isReported: true }),
    Review.countDocuments({ photos: { $exists: true, $not: { $size: 0 } } }),
  ]);

  const ratingDist = await Review.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  return successResponse(res, {
    stats: { pending, approved, rejected, reported, photoReviews },
    ratingDistribution: ratingDist,
  }, "Review stats fetched.");
});
