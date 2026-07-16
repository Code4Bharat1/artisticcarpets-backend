import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import productRouter from "./routes/product.routes.js";
import { sendError } from "./utils/helpers.js";

// ─────────────────────────────────────────────
// __dirname equivalent for ES Modules
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─────────────────────────────────────────────
// Security & utility middleware
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// HTTP request logger (compact in production, coloured in dev)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────
// Static file serving — uploaded product images
// Accessible at: GET /uploads/products/<filename>
// ─────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Artistic Carpets API is running 🚀",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "OK", uptime: process.uptime() });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use("/api", productRouter);
// app.use("/api", authRouter);  ← wire up future routers here

// ─────────────────────────────────────────────
// 404 handler — catches unmatched routes
// ─────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
});

// ─────────────────────────────────────────────
// Global error handler — catches next(err) calls
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.statusCode || err.status || 500;
  sendError(
    res,
    statusCode,
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message
  );
});

export default app;
