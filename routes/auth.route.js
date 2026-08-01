import { Router } from "express";
import { body } from "express-validator";
import {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Admin Auth
// ─────────────────────────────────────────────

// POST /api/auth/admin/register
router.post(
  "/admin/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("phoneNumber").trim().notEmpty().withMessage("Phone number is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  registerAdmin
);

// POST /api/auth/admin/login  (email or phone + password)
router.post(
  "/admin/login",
  [
    body("identifier").trim().notEmpty().withMessage("Email or phone number is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  loginAdmin
);

// POST /api/auth/admin/logout  (protected)
router.post("/admin/logout", protect, logoutAdmin);

// ─────────────────────────────────────────────
// User Auth
// ─────────────────────────────────────────────

// POST /api/auth/user/register
router.post(
  "/user/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("phoneNumber").trim().notEmpty().withMessage("Phone number is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  registerUser
);

// POST /api/auth/user/login  (email or phone + password)
router.post(
  "/user/login",
  [
    body("identifier").trim().notEmpty().withMessage("Email or phone number is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  loginUser
);

// POST /api/auth/user/logout  (protected)
router.post("/user/logout", protect, logoutUser);

// POST /api/auth/user/google
router.post("/user/google", googleLogin);

// ─────────────────────────────────────────────
// Shared Auth
// ─────────────────────────────────────────────

// POST /api/auth/refresh-token
router.post(
  "/refresh-token",
  [body("token").notEmpty().withMessage("Token is required.")],
  validate,
  refreshToken
);

// POST /api/auth/change-password  (protected)
router.post(
  "/change-password",
  protect,
  [
    body("oldPassword").notEmpty().withMessage("Old password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  validate,
  changePassword
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required.")],
  validate,
  forgotPassword
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  validate,
  resetPassword
);

export default router;
