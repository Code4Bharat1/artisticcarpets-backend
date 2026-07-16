import { Router } from "express";
import {
  createReview,
  getProductReviews,
  getReviews,
  moderateReview,
  replyToReview,
  reportReview,
  voteHelpful,
  getReviewStats,
} from "../controllers/review.controller.js";
import { protect, adminOnly, optionalAuth } from "../middleware/auth.middleware.js";
import multer from "multer";
import { FOLDERS } from "../middleware/upload.middleware.js";
import path from "path";

const reviewPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, FOLDERS.media),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `review-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("photos", 5);

const router = Router();

// Public
router.get("/product/:productId", optionalAuth, getProductReviews);

// Customer
router.post("/",                protect, reviewPhotoUpload, createReview);
router.post("/:id/report",      protect, reportReview);
router.post("/:id/helpful",     protect, voteHelpful);

// Admin
router.get  ("/",               protect, adminOnly, getReviews);
router.get  ("/stats",          protect, adminOnly, getReviewStats);
router.patch("/:id/moderate",   protect, adminOnly, moderateReview);
router.post ("/:id/reply",      protect, adminOnly, replyToReview);

export default router;
