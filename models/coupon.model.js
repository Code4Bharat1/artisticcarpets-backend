import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String },

    type: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },

    value: { type: Number, required: true }, // % or flat amount
    maxDiscount: { type: Number }, // Cap for percentage discounts
    minimumOrderAmount: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number }, // for free_shipping type

    // Usage limits
    usageLimit: { type: Number }, // total times this coupon can be used
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

    // Who used it
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      },
    ],

    // Validity
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },

    // Restrictions
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    applicableCollections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }],
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Targeting
    forNewUsersOnly: { type: Boolean, default: false },
    forVIPOnly: { type: Boolean, default: false },
    specificUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: is expired
couponSchema.virtual("isExpired").get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual: is usage limit reached
couponSchema.virtual("isExhausted").get(function () {
  return this.usageLimit && this.usedCount >= this.usageLimit;
});

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ expiresAt: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
