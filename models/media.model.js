import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String },
    url: { type: String, required: true },
    publicId: { type: String }, // Cloudinary public_id
    thumbnailUrl: { type: String },

    type: {
      type: String,
      enum: ["image", "video", "document"],
      default: "image",
    },
    mimeType: { type: String },
    size: { type: Number }, // bytes
    width: { type: Number },
    height: { type: Number },
    format: { type: String }, // jpg, png, webp, etc.

    // Organization
    folder: { type: String, default: "general" },
    tags: [{ type: String }],
    altText: { type: String },
    caption: { type: String },

    // AI Alt Text
    aiAltText: { type: String },
    aiAltGenerated: { type: Boolean, default: false },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

mediaSchema.index({ folder: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ filename: "text", altText: "text", tags: "text" });

const Media = mongoose.model("Media", mediaSchema);
export default Media;
