import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    image: { type: String },
    icon: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },

    // Display
    sortOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Stats (denormalized)
    productCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });

const Category = mongoose.model("Category", categorySchema);
export default Category;
