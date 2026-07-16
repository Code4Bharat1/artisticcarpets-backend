import { Router } from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponAnalytics,
} from "../controllers/coupon.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// Public (cart)
router.post("/validate", protect, validateCoupon);

// Admin
router.get   ("/"              , protect, adminOnly, getCoupons);
router.get   ("/:id"           , protect, adminOnly, getCouponById);
router.get   ("/:id/analytics" , protect, adminOnly, getCouponAnalytics);
router.post  ("/"              , protect, adminOnly, createCoupon);
router.put   ("/:id"           , protect, adminOnly, updateCoupon);
router.delete("/:id"           , protect, adminOnly, deleteCoupon);

export default router;
