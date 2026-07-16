import jwt from "jsonwebtoken";

/**
 * Generate an access token (short-lived)
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
};

/**
 * Generate a refresh token (long-lived)
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Generate a short-lived one-time token (email verification, password reset)
 */
export const generateOTPToken = () => {
  const token = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const expire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, expire };
};

/**
 * Generate a password reset token (10 min expiry)
 */
export const generatePasswordResetToken = () => {
  const token = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);
  const expire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { token, expire };
};

/**
 * Set refresh token as httpOnly cookie
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};
