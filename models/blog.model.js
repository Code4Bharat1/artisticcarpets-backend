import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    excerpt: { type: String },
    content: { type: String, required: true }, // Rich HTML content
    featuredImage: { type: String },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: { type: String }, // Snapshot

    categories: [{ type: String }],
    tags: [{ type: String }],

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    canonicalUrl: { type: String },

    // Publishing
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },

    // Stats
    viewCount: { type: Number, default: 0 },
    readTime: { type: Number }, // minutes

    isFeatured: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blogSchema.pre("save", async function (next) {
  if (this.isModified("title") || this.isNew) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;
    while (await mongoose.model("Blog").findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
  // Auto-calculate read time
  if (this.isModified("content") && this.content) {
    const wordCount = this.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  next();
});

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: "text", excerpt: "text", tags: "text" });

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
