import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    body: { type: String, required: true, trim: true },

    photos: [{ type: String }],
    videos: [{ type: String }],

    // Admin reply
    reply: {
      message: { type: String },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      repliedAt: { type: Date },
    },

    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isVerifiedPurchase: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Helpful votes
    helpfulCount: { type: Number, default: 0 },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Update product rating after save
reviewSchema.post("save", async function () {
  const Product = mongoose.model("Product");
  const stats = await mongoose
    .model("Review")
    .aggregate([
      { $match: { product: this.product, status: "approved" } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
