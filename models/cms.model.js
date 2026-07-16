import mongoose from "mongoose";

const cmsPageSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      // e.g. "homepage", "about-us", "contact", "privacy-policy", "terms", "shipping-policy", "faq"
    },
    title: { type: String, required: true },
    content: { type: String }, // Rich HTML content
    sections: [
      {
        sectionKey: { type: String },
        title: { type: String },
        content: { type: String },
        image: { type: String },
        data: { type: mongoose.Schema.Types.Mixed }, // flexible JSON for structured sections
      },
    ],
    isActive: { type: Boolean, default: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    canonicalUrl: { type: String },
  },
  { timestamps: true }
);

cmsPageSchema.index({ pageKey: 1 });

const CmsPage = mongoose.model("CmsPage", cmsPageSchema);
export default CmsPage;
