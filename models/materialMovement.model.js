import mongoose from "mongoose";

const materialMovementSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    type: {
      type: String,
      enum: ["Add Stock", "Consume Stock", "Adjust Stock", "Transfer Stock"],
      required: true,
    },
    quantity: { type: Number, required: true }, // Positive for add/transfer, negative for consume/reduce
    previousStock: { type: Number },
    newStock: { type: Number },
    reason: { type: String, trim: true },
    remarks: { type: String, trim: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

materialMovementSchema.index({ material: 1 });
materialMovementSchema.index({ type: 1 });
materialMovementSchema.index({ createdAt: -1 });

const MaterialMovement = mongoose.model("MaterialMovement", materialMovementSchema);
export default MaterialMovement;
