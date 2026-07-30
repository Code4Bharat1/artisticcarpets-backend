import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderStatus,
  addInternalNote,
  getOrderStats,
  getRevenueChart,
} from "../controllers/order.controller.js";
import { protect, optionalAuth, adminOnly } from "../middleware/auth.middleware.js";

const router = Router();

// Customer
router.post ("/"           , optionalAuth, createOrder);
router.get  ("/my"         , protect, getMyOrders);
router.get  ("/:id"        , protect, getOrderById);
// Admin
router.get  ("/"                    , protect, adminOnly, getOrders);
router.get  ("/stats/overview"      , protect, adminOnly, getOrderStats);
router.get  ("/stats/revenue-chart" , protect, adminOnly, getRevenueChart);
router.post ("/:id/status"          , protect, adminOnly, updateOrderStatus);
router.post ("/:id/notes"           , protect, adminOnly, addInternalNote);
export default router;
