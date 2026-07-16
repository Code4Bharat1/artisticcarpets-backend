import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLog.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, authorize("super_admin", "admin"), getAuditLogs);

export default router;
