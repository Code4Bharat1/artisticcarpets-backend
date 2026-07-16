import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

// ─── Dashboard Overview ───────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today      = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth  = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    todayRevenue,
    monthRevenue,
    lastMonthRevenue,
    todayOrders,
    monthOrders,
    pendingOrders,
    completedOrders,
    returnedOrders,
    totalCustomers,
    newCustomersThisMonth,
    inventoryValue,
    avgOrderValue,
    totalRefundAmount,
  ] = await Promise.all([
    // Revenue
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd }, "payment.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    // Orders
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: monthStart } }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "delivered" }),
    Order.countDocuments({ status: { $in: ["returned", "refunded"] } }),
    // Customers
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: monthStart } }),
    // Inventory
    Product.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: null, value: { $sum: { $multiply: ["$price", "$stock"] } } } },
    ]),
    // AOV
    Order.aggregate([
      { $match: { "payment.status": "paid" } },
      { $group: { _id: null, avg: { $avg: "$total" } } },
    ]),
    // Refunds
    Order.aggregate([
      { $match: { "payment.status": "refunded" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);

  const thisMonthRev  = monthRevenue[0]?.total     || 0;
  const lastMonthRev  = lastMonthRevenue[0]?.total  || 0;
  const revenueChange = lastMonthRev
    ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
    : 100;

  return successResponse(res, {
    stats: {
      todayRevenue:       todayRevenue[0]?.total     || 0,
      monthRevenue:       thisMonthRev,
      revenueChange,
      todayOrders,
      monthOrders,
      pendingOrders,
      completedOrders,
      returnedOrders,
      totalCustomers,
      newCustomersThisMonth,
      inventoryValue:     inventoryValue[0]?.value    || 0,
      avgOrderValue:      Math.round(avgOrderValue[0]?.avg || 0),
      totalRefundAmount:  totalRefundAmount[0]?.total  || 0,
    },
  }, "Dashboard stats fetched.");
});

// ─── Revenue Chart ────────────────────────────────────────────────────────────

export const getRevenueChart = asyncHandler(async (req, res) => {
  const period = req.query.period || "monthly"; // daily | weekly | monthly | quarterly
  const months = parseInt(req.query.months) || 12;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);

  let groupBy;
  if (period === "daily") {
    groupBy = {
      year:  { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day:   { $dayOfMonth: "$createdAt" },
    };
  } else if (period === "weekly") {
    groupBy = {
      year: { $year: "$createdAt" },
      week: { $week: "$createdAt" },
    };
  } else if (period === "quarterly") {
    groupBy = {
      year:    { $year: "$createdAt" },
      quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } },
    };
  } else {
    groupBy = {
      year:  { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
  }

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate }, "payment.status": "paid" } },
    {
      $group: {
        _id:     groupBy,
        revenue: { $sum: "$total" },
        orders:  { $sum: 1 },
        avgValue:{ $avg: "$total" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  return successResponse(res, { chart: data }, "Revenue chart fetched.");
});

// ─── Top Products ─────────────────────────────────────────────────────────────

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const topBySales = await Product.find({ isArchived: false })
    .select("name slug mainImage soldCount price rating reviewCount category")
    .populate("category", "name")
    .sort("-soldCount")
    .limit(limit);

  const topByRevenue = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    { $unwind: "$items" },
    {
      $group: {
        _id:      "$items.product",
        name:     { $first: "$items.name" },
        revenue:  { $sum: "$items.totalPrice" },
        quantity: { $sum: "$items.quantity" },
        orders:   { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  return successResponse(res, { topBySales, topByRevenue }, "Top products fetched.");
});

// ─── Top Categories ───────────────────────────────────────────────────────────

export const getTopCategories = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $group: {
        _id:      "$category._id",
        name:     { $first: "$category.name" },
        revenue:  { $sum: "$items.totalPrice" },
        quantity: { $sum: "$items.quantity" },
        orders:   { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  return successResponse(res, { categories: data }, "Top categories fetched.");
});

// ─── Sales by Country ─────────────────────────────────────────────────────────

export const getSalesByCountry = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $match: { "payment.status": "paid" } },
    {
      $group: {
        _id:     "$shippingAddress.country",
        revenue: { $sum: "$total" },
        orders:  { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
  ]);

  return successResponse(res, { countries: data }, "Sales by country fetched.");
});

// ─── Customer Retention ───────────────────────────────────────────────────────

export const getCustomerRetention = asyncHandler(async (req, res) => {
  const totalCustomers = await User.countDocuments({ role: "customer" });

  const repeatCustomers = await Order.aggregate([
    {
      $group: {
        _id:    "$customer",
        count:  { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $count: "total" },
  ]);

  const repeatCount = repeatCustomers[0]?.total || 0;
  const retentionRate = totalCustomers
    ? Math.round((repeatCount / totalCustomers) * 100)
    : 0;

  // New vs returning by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const newCustomers = await User.aggregate([
    { $match: { role: "customer", createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return successResponse(res, {
    retention: {
      totalCustomers,
      repeatCustomers: repeatCount,
      retentionRate,
    },
    newCustomersByMonth: newCustomers,
  }, "Customer retention fetched.");
});

// ─── Conversion Funnel ────────────────────────────────────────────────────────

export const getConversionFunnel = asyncHandler(async (req, res) => {
  const [totalVisits, ordersPlaced, ordersPaid] = await Promise.all([
    Product.aggregate([{ $group: { _id: null, views: { $sum: "$viewCount" } } }]),
    Order.countDocuments(),
    Order.countDocuments({ "payment.status": "paid" }),
  ]);

  const visits    = totalVisits[0]?.views || 1;
  const placed    = ordersPlaced;
  const paid      = ordersPaid;
  const convRate  = Math.round((paid / visits) * 100 * 100) / 100;

  return successResponse(res, {
    funnel: {
      productViews:   visits,
      ordersPlaced:   placed,
      ordersPaid:     paid,
      conversionRate: convRate,
    },
  }, "Conversion funnel fetched.");
});
