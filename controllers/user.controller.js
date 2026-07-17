import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { buildFileUrl } from "../services/file.service.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

// ─── Update Profile ──────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "firstName", "lastName", "phone",
    "preferredCurrency", "preferredLanguage",
    "newsletterSubscribed", "smsSubscribed",
  ];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  // Avatar upload
  if (req.file) {
    updates.avatar = buildFileUrl(req, req.file);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!user) return errorResponse(res, "User not found.", 404);

  return successResponse(res, { user: user.toPublic() }, "Profile updated.");
});

// ─── Addresses ───────────────────────────────────────────────────────────────

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // If this is set as default, unset all others
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  // First address is always default
  if (user.addresses.length === 0) {
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  return successResponse(res, { addresses: user.addresses }, "Address added.", 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) return errorResponse(res, "Address not found.", 404);

  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }

  Object.assign(address, req.body);
  await user.save();

  return successResponse(res, { addresses: user.addresses }, "Address updated.");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) return errorResponse(res, "Address not found.", 404);

  address.deleteOne();
  await user.save();

  return successResponse(res, { addresses: user.addresses }, "Address removed.");
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  const index = user.wishlist.findIndex((id) => id.toString() === productId);
  let added = false;

  if (index === -1) {
    user.wishlist.push(productId);
    added = true;
  } else {
    user.wishlist.splice(index, 1);
  }

  await user.save();
  return successResponse(res, { added, wishlistCount: user.wishlist.length }, added ? "Added to wishlist." : "Removed from wishlist.");
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("wishlist", "name mainImage price discountPrice slug rating reviewCount isActive");

  if (!user) return errorResponse(res, "User not found.", 404);

  return successResponse(res, { wishlist: user.wishlist }, "Wishlist fetched.");
});

// ─── Admin: List All Users ───────────────────────────────────────────────────

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, role, isActive, isBanned, isVIP, sort = "-createdAt" } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName:  { $regex: search, $options: "i" } },
      { email:     { $regex: search, $options: "i" } },
      { phone:     { $regex: search, $options: "i" } },
    ];
  }
  if (role)     filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isBanned !== undefined) filter.isBanned = isBanned === "true";
  if (isVIP    !== undefined) filter.isVIP    = isVIP    === "true";

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken -resetPasswordToken -emailVerificationToken")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return paginatedResponse(res, users, buildPagination(page, limit, total));
});

// ─── Admin: Get Single User ──────────────────────────────────────────────────

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -refreshToken -resetPasswordToken -emailVerificationToken");

  if (!user) return errorResponse(res, "User not found.", 404);

  // Fetch their orders
  const orders = await Order.find({ customer: user._id })
    .select("orderNumber total status createdAt payment.status")
    .sort("-createdAt")
    .limit(10);

  // Fetch their reviews
  const reviews = await Review.find({ user: user._id })
    .populate("product", "name mainImage")
    .select("rating title body status createdAt")
    .sort("-createdAt")
    .limit(5);

  return successResponse(res, { user, orders, reviews }, "User fetched.");
});

// ─── Admin: Update User ──────────────────────────────────────────────────────

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const allowedFields = [
    "firstName", "lastName", "phone", "role",
    "isActive", "isBanned", "banReason",
    "isVIP", "loyaltyPoints", "loyaltyTier",
    "adminNotes",
  ];

  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) return errorResponse(res, "User not found.", 404);

  await createAuditLog({
    user: req.user,
    action: "UPDATE_USER",
    module: "User",
    targetId: user._id,
    targetName: user.email,
    changes: updates,
    req,
  });

  return successResponse(res, { user }, "User updated.");
});

// ─── Admin: Delete User ──────────────────────────────────────────────────────

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, "User not found.", 404);

  if (user.role === "super_admin") {
    return errorResponse(res, "Cannot delete a super admin.", 403);
  }

  await User.findByIdAndDelete(req.params.id);

  await createAuditLog({
    user: req.user,
    action: "DELETE_USER",
    module: "User",
    targetId: user._id,
    targetName: user.email,
    req,
  });

  return successResponse(res, {}, "User deleted.");
});

// ─── Admin: User Stats ───────────────────────────────────────────────────────

export const getUserStats = asyncHandler(async (req, res) => {
  const [total, customers, admins, banned, vip, newThisMonth] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: { $in: ["admin", "super_admin", "manager"] } }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isVIP: true }),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) },
    }),
  ]);

  return successResponse(res, {
    stats: { total, customers, admins, banned, vip, newThisMonth },
  }, "User stats fetched.");
});
