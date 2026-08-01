import mongoose from "mongoose";

const instagramSettingSchema = new mongoose.Schema(
  {
    businessId: {
      type: String,
      default: "",
    },
    accessToken: {
      type: String,
      default: "",
    },
    lastSyncTime: {
      type: Date,
      default: null,
    },
    connectionStatus: {
      type: String,
      enum: ["CONNECTED", "DISCONNECTED", "ERROR"],
      default: "DISCONNECTED",
    },
    importedPostsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InstagramSetting", instagramSettingSchema);
