import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { OAuth2Client } from "google-auth-library";

// ─── helpers ─────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const signToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/admin/register
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    // Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ success: false, message: "Email already registered." });

    // Check duplicate phone
    const existingPhone = await User.findOne({ phone: phoneNumber });
    if (existingPhone)
      return res.status(400).json({ success: false, message: "Phone number already registered." });

    // Split name into firstName + lastName (model requires both)
    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    const admin = await User.create({
      firstName,
      lastName,
      email,
      phone: phoneNumber,
      password,
      role: "admin",
    });

    const token = signToken(admin._id, admin.role);

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      token,
      admin: { id: admin._id, name: admin.fullName, email: admin.email, role: admin.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/admin/login  (email or phone + password)
export const loginAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const admin = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      role: { $in: ["admin", "super_admin", "manager"] },
    }).select("+password");

    if (!admin)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const ok = await admin.comparePassword(password);
    if (!ok)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = signToken(admin._id, admin.role);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      admin: { id: admin._id, name: admin.fullName, email: admin.email, phone: admin.phone, role: admin.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/admin/logout
export const logoutAdmin = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: "Admin logged out successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER AUTH
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/user/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    // Check duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ success: false, message: "Email already registered." });

    // Check duplicate phone
    const existingPhone = await User.findOne({ phone: phoneNumber });
    if (existingPhone)
      return res.status(400).json({ success: false, message: "Phone number already registered." });

    // Split name into firstName + lastName
    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phoneNumber,
      password,
      role: "customer",
    });

    const token = signToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: { id: user._id, name: user.fullName, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/user/login  (email or phone + password)
export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select("+password");

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    if (user.isBanned)
      return res.status(403).json({ success: false, message: "Your account has been banned." });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = signToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token,
      user: { id: user._id, name: user.fullName, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/user/logout
export const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: "User logged out successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/user/google
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Google token is required." });
    }

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, sub } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // User exists, check if banned
      if (user.isBanned) {
        return res.status(403).json({ success: false, message: "Your account has been banned." });
      }
      
      // If user exists but no googleId, optionally update it
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = "google";
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        firstName: given_name || "Google",
        lastName: family_name || "User",
        email,
        googleId: sub,
        authProvider: "google",
        avatar: picture,
        role: "customer",
        isEmailVerified: true, // Google emails are pre-verified
      });
    }

    const jwtToken = signToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Logged in with Google successfully.",
      token: jwtToken,
      user: { id: user._id, name: user.fullName, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Google Authentication failed. Please verify your client ID." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED AUTH
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const newToken = signToken(payload.id, payload.role);

    return res.status(200).json({ success: true, token: newToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// POST /api/auth/change-password  (protected — req.user set by protect middleware)
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;

    const user = await User.findById(id).select("+password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Old password is incorrect." });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "No account found with this email." });

    // TODO: generate a real token, save to DB, and email it
    const resetToken = "123456"; // placeholder

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
      resetToken, // remove in production — send via email only
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // TODO: validate resetToken against stored DB token & expiry
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found." });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};