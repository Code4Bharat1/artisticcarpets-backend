import Product from "../models/product.model.js";
import InventoryMovement from "../models/inventory.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPagination,
} from "../utils/apiResponse.js";
import { createAuditLog } from "../utils/auditLog.utils.js";

// ─── Get Inventory Overview ───────────────────────────────────────────────────

export const getInventoryOverview = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const {
    search, category, collection,
    stockStatus, sort = "-updatedAt",
  } = req.query;

  const filter = { isArchived: false };
  if (search)   filter.$text    = { $search: search };
  if (category) filter.category = category;
  if (collection) filter.collection = collection;

  if (stockStatus === "in_stock")   filter.stock = { $gt: 10 };
  if (stockStatus === "low_stock")  filter.stock = { $gt: 0, $lte: 10 };
  if (stockStatus === "out_of_stock") filter.stock = 0;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name")
      .populate("collection", "name")
      .select("name sku mainImage stock reservedStock minimumStock price warehouse isActive")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return paginatedResponse(res, products, buildPagination(page, limit, total));
});

// ─── Adjust Stock ─────────────────────────────────────────────────────────────

export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, quantity, type, notes, warehouse } = req.body;

  const product = await Product.findById(productId);
  if (!product) return errorResponse(res, "Product not found.", 404);

  const previousStock = product.stock;
  const newStock = previousStock + Number(quantity);

  if (newStock < 0) {
    return errorResponse(res, "Stock cannot go below 0.", 400);
  }

  product.stock = newStock;
  if (warehouse) product.warehouse = warehouse;
  await product.save();

  await InventoryMovement.create({
    product: product._id,
    sku: product.sku,
    type: type || "adjustment",
    quantity: Number(quantity),
    previousStock,
    newStock,
    warehouse,
    notes,
    performedBy: req.user._id,
  });

  await createAuditLog({
    user: req.user, action: "ADJUST_STOCK", module: "Inventory",
    targetId: product._id, targetName: product.name,
    changes: { previousStock, newStock, quantity },
    req,
  });

  return successResponse(res, {
    product: { _id: product._id, name: product.name, stock: newStock, sku: product.sku },
  }, "Stock adjusted.");
});

// ─── Bulk Stock Update ────────────────────────────────────────────────────────

export const bulkStockUpdate = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  // updates: [{ productId, stock, notes }]

  if (!updates?.length) return errorResponse(res, "No updates provided.", 400);

  const results = [];

  for (const u of updates) {
    const product = await Product.findById(u.productId);
    if (!product) { results.push({ productId: u.productId, error: "Not found" }); continue; }

    const previousStock = product.stock;
    product.stock = Number(u.stock);
    await product.save();

    await InventoryMovement.create({
      product: product._id,
      sku: product.sku,
      type: "adjustment",
      quantity: product.stock - previousStock,
      previousStock,
      newStock: product.stock,
      notes: u.notes || "Bulk stock update",
      performedBy: req.user._id,
    });

    results.push({ productId: u.productId, name: product.name, stock: product.stock });
  }

  return successResponse(res, { results }, "Bulk stock update completed.");
});

// ─── Inventory Movements ──────────────────────────────────────────────────────

export const getInventoryMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { productId, type, startDate, endDate, sort = "-createdAt" } = req.query;

  const filter = {};
  if (productId)          filter.product   = productId;
  if (type)               filter.type      = type;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const [movements, total] = await Promise.all([
    InventoryMovement.find(filter)
      .populate("product", "name sku mainImage")
      .populate("performedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    InventoryMovement.countDocuments(filter),
  ]);

  return paginatedResponse(res, movements, buildPagination(page, limit, total));
});

// ─── Inventory Stats ──────────────────────────────────────────────────────────

export const getInventoryStats = asyncHandler(async (req, res) => {
  const [total, lowStock, outOfStock, totalValue] = await Promise.all([
    Product.countDocuments({ isArchived: false }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 10 }, isArchived: false }),
    Product.countDocuments({ stock: 0, isArchived: false }),
    Product.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, value: { $sum: { $multiply: ["$price", "$stock"] } } } },
    ]),
  ]);

  // Low stock items list
  const lowStockItems = await Product.find({
    stock: { $gt: 0, $lte: 10 }, isArchived: false
  })
    .select("name sku stock minimumStock mainImage")
    .sort("stock")
    .limit(10);

  return successResponse(res, {
    stats: {
      total,
      lowStock,
      outOfStock,
      inStock: total - outOfStock,
      inventoryValue: totalValue[0]?.value || 0,
    },
    lowStockItems,
  }, "Inventory stats fetched.");
});
