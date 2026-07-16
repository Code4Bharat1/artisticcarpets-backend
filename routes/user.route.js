import { Router } from "express";
import {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  toggleWishlist,
  getWishlist,
  getUsers,
  getUserById,
  adminUpdateUser,
  deleteUser,
  getUserStats,
} from "../controllers/user.controller.js";
import { protect, adminOnly, authorize } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = Router();

// ── Customer routes ──────────────────────────────────────────────────────────
router.put("/profile", protect, uploadAvatar, updateProfile);

router.post   ("/addresses",             protect, addAddress);
router.put    ("/addresses/:addressId",  protect, updateAddress);
router.delete ("/addresses/:addressId",  protect, deleteAddress);

router.get    ("/wishlist",              protect, getWishlist);
router.post   ("/wishlist/:productId",   protect, toggleWishlist);

// ── Admin routes ─────────────────────────────────────────────────────────────
router.get  ("/",       protect, adminOnly, getUsers);
router.get  ("/stats",  protect, adminOnly, getUserStats);
router.get  ("/:id",    protect, adminOnly, getUserById);
router.put  ("/:id",    protect, authorize("super_admin", "admin", "manager"), adminUpdateUser);
router.delete("/:id",   protect, authorize("super_admin"), deleteUser);

export default router;
