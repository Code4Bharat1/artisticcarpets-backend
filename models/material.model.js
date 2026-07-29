import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    image: {
      filename: { type: String },
      path: { type: String },
    },

    // Stock Information
    currentStock: { type: Number, default: 0 },
    unit: {
      type: String,
      enum: ["Kg", "Gram", "Meter", "Roll", "Piece", "Liter"],
      default: "Piece",
    },
    minStockLevel: { type: Number, default: 0 },
    maxCapacity: { type: Number },
    warehouse: { type: String, trim: true },
    rackNumber: { type: String, trim: true },
    binNumber: { type: String, trim: true },

    // Purchase Information
    supplier: { type: String, trim: true },
    purchasePricePerUnit: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    invoiceNumber: { type: String, trim: true },
    batchNumber: { type: String, trim: true },

    // Notes
    remarks: { type: String, trim: true },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

materialSchema.index({ code: 1 });
materialSchema.index({ name: 1 });
materialSchema.index({ status: 1 });

const Material = mongoose.model("Material", materialSchema);
export default Material;
