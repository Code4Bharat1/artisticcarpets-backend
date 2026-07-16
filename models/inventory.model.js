import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: { type: mongoose.Schema.Types.ObjectId },
    sku: { type: String },

    type: {
      type: String,
      enum: [
        "purchase",     // incoming stock from supplier
        "sale",         // outgoing due to order
        "return",       // customer return
        "adjustment",   // manual admin adjustment
        "transfer",     // between warehouses
        "damage",       // damaged/written off
        "reserved",     // reserved for order
        "unreserved",   // reservation released
      ],
      required: true,
    },

    quantity: { type: Number, required: true }, // positive = in, negative = out
    previousStock: { type: Number },
    newStock: { type: Number },

    warehouse: { type: String },
    reference: { type: String }, // Order number, PO number, etc.
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // linked document ID
    notes: { type: String },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1 });
inventoryMovementSchema.index({ type: 1 });
inventoryMovementSchema.index({ createdAt: -1 });
inventoryMovementSchema.index({ sku: 1 });

const InventoryMovement = mongoose.model("InventoryMovement", inventoryMovementSchema);
export default InventoryMovement;
