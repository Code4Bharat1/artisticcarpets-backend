import asyncHandler from "../utils/asyncHandler.js";
import Material from "../models/material.model.js";
import MaterialMovement from "../models/materialMovement.model.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { paginatedResponse, buildPagination } from "../utils/apiResponse.js";

// ─── Create Material ─────────────────────────────────────────────────────────

export const createMaterial = asyncHandler(async (req, res) => {
  const {
    name, category, description, image,
    currentStock, unit, minStockLevel, maxCapacity, warehouse, rackNumber, binNumber,
    supplier, purchasePricePerUnit, purchaseDate, invoiceNumber, batchNumber, remarks
  } = req.body;

  if (!name) {
    return errorResponse(res, "Material Name is required", 400);
  }

  // Auto Generate Code: MAT- + random string or counter.
  // For simplicity, we'll generate a random 6 char hex if not provided.
  let generatedCode = req.body.code;
  if (!generatedCode) {
    const count = await Material.countDocuments();
    generatedCode = `MAT-${(count + 1001).toString()}`;
  }

  const material = new Material({
    name, code: generatedCode, category, description, image,
    currentStock: Number(currentStock) || 0,
    unit, minStockLevel: Number(minStockLevel) || 0,
    maxCapacity: Number(maxCapacity) || 0,
    warehouse, rackNumber, binNumber,
    supplier, purchasePricePerUnit: Number(purchasePricePerUnit) || 0,
    purchaseDate, invoiceNumber, batchNumber, remarks
  });

  await material.save();

  // If initial stock is greater than 0, create an initial movement log
  if (material.currentStock > 0) {
    await MaterialMovement.create({
      material: material._id,
      type: "Add Stock",
      quantity: material.currentStock,
      previousStock: 0,
      newStock: material.currentStock,
      reason: "Initial Stock",
      remarks: "Added during material creation",
      performedBy: req.user?._id
    });
  }

  return successResponse(res, material, "Material created successfully", 201);
});

// ─── Get All Materials ───────────────────────────────────────────────────────

export const getMaterials = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category, status } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  let filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } }
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;

  const [materials, total] = await Promise.all([
    Material.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Material.countDocuments(filter)
  ]);

  return paginatedResponse(res, materials, buildPagination(Number(page), Number(limit), total));
});

// ─── Get Material Stats ────────────────────────────────────────────────────────

export const getMaterialStats = asyncHandler(async (req, res) => {
  const materials = await Material.find({});
  
  let total = materials.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let inventoryValue = 0;
  let unitTotals = {};

  materials.forEach(mat => {
    const stock = mat.currentStock || 0;
    const minStock = mat.minStockLevel || 0;
    const price = mat.purchasePricePerUnit || 0;
    const unit = mat.unit || "Units";

    if (stock <= 0) {
      outOfStock++;
    } else if (stock <= minStock) {
      lowStock++;
      inStock++;
    } else {
      inStock++;
    }

    if (stock > 0) {
      if (!unitTotals[unit]) unitTotals[unit] = 0;
      unitTotals[unit] += stock;
    }

    inventoryValue += stock * price;
  });

  let totalQuantityString = Object.entries(unitTotals)
    .map(([u, val]) => `${val.toLocaleString()} ${u}`)
    .join(", ") || "0";

  return successResponse(res, {
    stats: {
      total,
      inStock,
      totalQuantityString,
      lowStock,
      outOfStock,
      inventoryValue
    }
  });
});

// ─── Get Material By ID ──────────────────────────────────────────────────────

export const getMaterialById = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  
  if (!material) {
    return errorResponse(res, "Material not found", 404);
  }

  const movements = await MaterialMovement.find({ material: material._id })
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50); // Get recent 50 movements for details page

  return successResponse(res, { material, movements });
});

// ─── Update Material ─────────────────────────────────────────────────────────

export const updateMaterial = asyncHandler(async (req, res) => {
  // Prevent updating currentStock directly here, that should be done via updateStock
  const updateData = { ...req.body };
  delete updateData.currentStock;
  delete updateData.code; // Prevent code change

  const material = await Material.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!material) {
    return errorResponse(res, "Material not found", 404);
  }

  return successResponse(res, material, "Material updated successfully");
});

// ─── Update Stock ────────────────────────────────────────────────────────────

export const updateStock = asyncHandler(async (req, res) => {
  const { type, quantity, reason, remarks } = req.body;
  const qty = Number(quantity);

  if (!qty || qty <= 0) {
    return errorResponse(res, "Quantity must be greater than zero", 400);
  }

  if (!["Add Stock", "Consume Stock", "Adjust Stock", "Transfer Stock"].includes(type)) {
    return errorResponse(res, "Invalid operation type", 400);
  }

  const material = await Material.findById(req.params.id);
  if (!material) {
    return errorResponse(res, "Material not found", 404);
  }

  const previousStock = material.currentStock;
  let newStock = previousStock;

  if (type === "Add Stock" || type === "Transfer Stock") {
    newStock += qty;
  } else if (type === "Consume Stock") {
    if (previousStock < qty) {
      return errorResponse(res, "Insufficient stock", 400);
    }
    newStock -= qty;
  } else if (type === "Adjust Stock") {
    // Adjust Stock usually means setting an exact value, but the UI might just provide a diff.
    // Let's assume the UI sends the diff if they are 'adding' or 'subtracting' OR it just sends the absolute difference.
    // The prompt says "Add Stock, Consume Stock, Adjust Stock, Transfer Stock... Quantity". 
    // We will treat Adjust Stock as either positive or negative if we allow negative qty, 
    // but we blocked negative qty above. So let's assume Adjust Stock is replacing the total.
    newStock = qty; // If Adjust Stock means replacing the stock with the actual count.
  }

  material.currentStock = newStock;
  await material.save();

  const movement = await MaterialMovement.create({
    material: material._id,
    type,
    quantity: type === "Adjust Stock" ? (newStock - previousStock) : qty,
    previousStock,
    newStock,
    reason,
    remarks,
    performedBy: req.user?._id
  });

  return successResponse(res, { material, movement }, "Stock updated successfully");
});
