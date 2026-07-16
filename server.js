import "dotenv/config";
import fs from "fs";
import path from "path";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// Ensure the uploads directory exists on startup
// ─────────────────────────────────────────────
const UPLOAD_DIR = path.resolve("uploads/products");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 Created upload directory: ${UPLOAD_DIR}`);
}

// ─────────────────────────────────────────────
// Connect to MongoDB, then start HTTP server
// ─────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/products\n`);
    });

    // ── Graceful shutdown ──────────────────────
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("✅ HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ── Unhandled promise rejection guard ──────
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err.message);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();