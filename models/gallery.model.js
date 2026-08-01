import mongoose from "mongoose";
import slugify from "slugify";

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String },
    
    category: {
      type: String,
      enum: ["Residential", "Commercial", "Hotels", "Villas", "Mosques", "Offices", "Exhibitions", "Events", "Behind the Scenes"],
      default: "Residential",
    },
    
    clientName: { type: String, trim: true },
    location: { type: String, trim: true },
    completionDate: { type: String, trim: true }, // e.g. "March 2026"
    carpetType: { type: String, trim: true },
    areaCovered: { type: String, trim: true },
    designer: { type: String, trim: true },
    technique: { type: String, trim: true },
    
    materials: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    
    badge: {
      type: String,
      enum: [""],
      default: "",
    },
    
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    
    images: [{ type: String }],
    featuredImage: { type: String },
    instagramUrl: { type: String, trim: true },
    
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    
    displayOrder: { type: Number, default: 0 },
    
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    imageAltText: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug before saving
gallerySchema.pre("save", async function (next) {
  if (this.isModified("title") || this.isNew) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await mongoose.model("Gallery").findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;
