import { Router } from "express";
import { body, query } from "express-validator";
import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

// Public
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required."),
    body("lastName").trim().notEmpty().withMessage("Last name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  login
);

router.get("/verify-email", verifyEmail);

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  [body("password").isLength({ min: 6 })],
  validate,
  resetPassword
);

router.post("/refresh-token", refreshToken);

// Protected
router.get("/me", protect, getMe);

router.post(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  validate,
  changePassword
);

router.post("/logout", protect, logout);

export default router;
