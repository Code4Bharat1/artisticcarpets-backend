import mongoose from "mongoose";
import slugify from "slugify";

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    subtitle: { type: String },
    description: { type: String },
    image: { type: String },
    bannerImage: { type: String },
    coverVideo: { type: String },

    // Type: Persian, Modern, Outdoor, Vintage, Runner, Custom, Limited, Seasonal
    type: {
      type: String,
      enum: [
        "Persian",
        "Modern",
        "Outdoor",
        "Vintage",
        "Runner",
        "Custom Rugs",
        "Limited Collection",
        "Seasonal Collection",
        "Other",
      ],
      default: "Other",
    },

    // Display
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isLimited: { type: Boolean, default: false },
    isSeasonal: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },

    // Availability window for seasonal/limited
    availableFrom: { type: Date },
    availableTo: { type: Date },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },

    // Stats
    productCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

collectionSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

collectionSchema.index({ slug: 1 });
collectionSchema.index({ isActive: 1 });
collectionSchema.index({ isFeatured: 1 });

const Collection = mongoose.model("Collection", collectionSchema);
export default Collection;
