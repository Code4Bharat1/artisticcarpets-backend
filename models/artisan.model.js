import mongoose from "mongoose";
import slugify from "slugify";

const artisanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    bio: { type: String },
    shortBio: { type: String },
    photo: { type: String },
    coverImage: { type: String },

    // Location
    region: { type: String },   // e.g. "Kashmir", "Rajasthan"
    country: { type: String, default: "India" },

    // Craft
    specialty: [{ type: String }],   // e.g. ["Hand-knotted", "Persian Design"]
    experience: { type: Number },    // years of experience
    techniques: [{ type: String }],

    // Contact (internal only)
    email: { type: String },
    phone: { type: String },

    // Social
    instagram: { type: String },
    website: { type: String },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // Stats
    productCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

artisanSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});


artisanSchema.index({ isActive: 1 });

const Artisan = mongoose.model("Artisan", artisanSchema);
export default Artisan;
