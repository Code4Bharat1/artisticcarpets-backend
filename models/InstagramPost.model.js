import mongoose from "mongoose";

const instagramPostSchema = new mongoose.Schema(
  {
    instagramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    caption: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String, // 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String, // Only for VIDEO
      default: null,
    },
    permalink: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    username: {
      type: String,
      default: "",
    },
    children: [
      {
        mediaUrl: String,
        mediaType: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("InstagramPost", instagramPostSchema);
