import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createMaterial,
  getMaterials,
  getMaterialStats,
  getMaterialById,
  updateMaterial,
  updateStock
} from "../controllers/material.controller.js";

const router = express.Router();

router.route("/")
  .post(protect, adminOnly, createMaterial)
  .get(protect, adminOnly, getMaterials);

router.route("/stats")
  .get(protect, adminOnly, getMaterialStats);

router.route("/:id")
  .get(protect, adminOnly, getMaterialById)
  .put(protect, adminOnly, updateMaterial);

router.route("/:id/stock")
  .post(protect, adminOnly, updateStock);

export default router;
