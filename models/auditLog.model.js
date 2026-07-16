import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String }, // snapshot

    action: {
      type: String,
      required: true,
      // e.g. "CREATE_PRODUCT", "UPDATE_ORDER", "DELETE_USER", "LOGIN", "LOGOUT"
    },

    module: {
      type: String,
      required: true,
      // e.g. "Product", "Order", "User", "Auth", "Coupon"
    },

    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetName: { type: String }, // snapshot of target name

    changes: { type: mongoose.Schema.Types.Mixed }, // { before, after }
    description: { type: String },

    ip: { type: String },
    userAgent: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
