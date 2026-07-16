import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Sub-schema: image object { filename, path }
// ─────────────────────────────────────────────
const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Product Schema
// ─────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // ── Core Info ──────────────────────────────
    title: {
      type: String,
      required: [true, "Product title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters."],
    },

    description: {
      type: String,
      trim: true,
    },

    // ── Classification ─────────────────────────
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      index: true,
    },

    subCategory: {
      type: String,
      trim: true,
      index: true,
    },

    collection: {
      type: String,
      trim: true,
      index: true,
    },

    // ── Pricing ────────────────────────────────
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative."],
    },

    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative."],
      validate: {
        validator: function (val) {
          // discountPrice must be less than price if set
          if (val === null || val === undefined) return true;
          return val < this.price;
        },
        message: "Discount price must be less than the original price.",
      },
    },

    // Automatically calculated in the controller
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Inventory ──────────────────────────────
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative."],
    },

    // ── Product Attributes ─────────────────────
    material: {
      type: String,
      trim: true,
      index: true,
    },

    size: {
      type: String,
      trim: true,
      index: true,
    },

    shape: {
      type: String,
      trim: true,
      index: true,
    },

    color: {
      type: String,
      trim: true,
      index: true,
    },

    style: {
      type: String,
      trim: true,
      index: true,
    },

    room: {
      type: String,
      trim: true,
    },

    origin: {
      type: String,
      trim: true,
    },

    weavingType: {
      type: String,
      trim: true,
    },

    pileHeight: {
      type: String,
      trim: true,
    },

    weight: {
      type: String,
      trim: true,
    },

    // ── Media ──────────────────────────────────
    thumbnail: {
      type: imageSchema,
      default: null,
    },

    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "A product can have a maximum of 10 images.",
      },
    },

    // ── Flags ──────────────────────────────────
    isFeatured: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },

    // ── Status ─────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "draft"],
        message: "Status must be one of: active, inactive, draft.",
      },
      default: "active",
      index: true,
    },

    // ── Rating & Sales ─────────────────────────
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // always 1 decimal place
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── SEO ────────────────────────────────────
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [160, "Meta title cannot exceed 160 characters."],
    },

    metaDescription: {
      type: String,
      trim: true,
      maxlength: [320, "Meta description cannot exceed 320 characters."],
    },

    metaKeywords: {
      type: [String],
      default: [],
    },

    // ── Ownership ──────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────
// Virtual: isInStock
// ─────────────────────────────────────────────
productSchema.virtual("isInStock").get(function () {
  return this.stock > 0;
});

// ─────────────────────────────────────────────
// Compound indexes for common query patterns
// ─────────────────────────────────────────────
productSchema.index({ category: 1, status: 1 });
productSchema.index({ collection: 1, status: 1 });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ ratingAverage: -1, status: 1 });
productSchema.index({ totalSales: -1, status: 1 });
productSchema.index({ createdAt: -1, status: 1 });

// Full-text search index on title and description
productSchema.index({ title: "text", shortDescription: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;
