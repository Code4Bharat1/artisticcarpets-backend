import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" }, // Home, Work, Other
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, minlength: 6 },
    avatar: { type: String, default: "" },

    role: {
      type: String,
      enum: [
        "customer",
        "admin",
        "super_admin",
        "manager",
        "inventory_manager",
        "sales_manager",
        "content_manager",
        "support_executive",
      ],
      default: "customer",
    },

    // OAuth
    googleId: { type: String },
    appleId: { type: String },
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpire: { type: Date },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // Refresh token
    refreshToken: { type: String },

    // Profile
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Loyalty
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    isVIP: { type: Boolean, default: false },

    // Customer stats (denormalized for performance)
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date },

    // Admin flags
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },

    // Notes (internal, admin only)
    adminNotes: { type: String },

    // Preferences
    preferredCurrency: { type: String, default: "INR" },
    preferredLanguage: { type: String, default: "en" },
    newsletterSubscribed: { type: Boolean, default: false },
    smsSubscribed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full name
userSchema.virtual("fullName").get(function () {
  if (this.firstName && this.firstName === this.lastName) {
    return this.firstName;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Sanitize output - remove sensitive fields
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  return obj;
};

// Indexes

userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "addresses.isDefault": 1 });

const User = mongoose.model("User", userSchema);
export default User;
