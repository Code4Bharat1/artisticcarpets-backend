import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });

  await createAuditLog({
    user: req.user, action: "CREATE_COUPON", module: "Coupon",
    targetId: coupon._id, targetName: coupon.code, req,
  });

  return successResponse(res, { coupon }, "Coupon created.", 201);
});

export const getCoupons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, type, isActive, sort = "-createdAt" } = req.query;

  const filter = {};
  if (search)   filter.code = { $regex: search, $options: "i" };
  if (type)     filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .select("-usedBy")
      .populate("createdBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return paginatedResponse(res, coupons, buildPagination(page, limit, total));
});

export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate("createdBy", "firstName lastName");
  if (!coupon) return errorResponse(res, "Coupon not found.", 404);
  return successResponse(res, { coupon }, "Coupon fetched.");
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id, { $set: req.body }, { new: true, runValidators: true }
  );
  if (!coupon) return errorResponse(res, "Coupon not found.", 404);

  await createAuditLog({
    user: req.user, action: "UPDATE_COUPON", module: "Coupon",
    targetId: coupon._id, targetName: coupon.code, req,
  });

  return successResponse(res, { coupon }, "Coupon updated.");
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return errorResponse(res, "Coupon not found.", 404);

  await Coupon.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user, action: "DELETE_COUPON", module: "Coupon",
    targetId: coupon._id, targetName: coupon.code, req,
  });

  return successResponse(res, {}, "Coupon deleted.");
});

// Validate a coupon (public endpoint for cart)
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true })
    .select("-usedBy");

  if (!coupon) return errorResponse(res, "Invalid coupon code.", 404);
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return errorResponse(res, "This coupon has expired.", 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return errorResponse(res, "Coupon usage limit has been reached.", 400);
  }
  if (cartTotal && cartTotal < coupon.minimumOrderAmount) {
    return errorResponse(res, `Minimum order amount ₹${coupon.minimumOrderAmount} required.`, 400);
  }
  if (coupon.forVIPOnly && !req.user?.isVIP) {
    return errorResponse(res, "This coupon is for VIP members only.", 403);
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = ((cartTotal || 0) * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === "fixed") {
    discount = coupon.value;
  }

  return successResponse(res, {
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
    },
    discount: Math.round(discount),
  }, "Coupon is valid.");
});

// Analytics
export const getCouponAnalytics = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return errorResponse(res, "Coupon not found.", 404);

  const orders = await Order.find({ coupon: coupon._id })
    .select("orderNumber total couponDiscount createdAt customerSnapshot.email status")
    .sort("-createdAt")
    .limit(50);

  const totalDiscount = orders.reduce((s, o) => s + (o.couponDiscount || 0), 0);
  const totalRevenue  = orders.reduce((s, o) => s + o.total, 0);

  return successResponse(res, {
    coupon,
    analytics: {
      usedCount:     coupon.usedCount,
      totalDiscount,
      totalRevenue,
      orders,
    },
  }, "Coupon analytics fetched.");
});
