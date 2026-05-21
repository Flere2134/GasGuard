// ==========================================
// routes/index.js
// ==========================================
// Route aggregator for the GasGuard backend.
//
// This file collects all individual route
// modules and mounts them under their base
// paths. server.js imports only this one
// file instead of registering each route
// separately — keeping server.js clean.
//
// All routes are prefixed with /api:
//   /api/status    → status.js
//   /api/alerts    → alerts.js
//   /api/overrides → overrides.js
// ==========================================

const express        = require("express");
const router         = express.Router();
const logger         = require("../utils/logger");

const statusRoutes   = require("./status");
const alertRoutes    = require("./alerts");
const overrideRoutes = require("./overrides");

// ==========================================
// Mount Routes
// ==========================================
router.use("/status",    statusRoutes);
router.use("/alerts",    alertRoutes);
router.use("/overrides", overrideRoutes);

logger.info("Routes", "All routes mounted successfully.");
logger.info("Routes", "  GET  /api/status");
logger.info("Routes", "  GET  /api/status/health");
logger.info("Routes", "  GET  /api/alerts");
logger.info("Routes", "  GET  /api/alerts/history");
logger.info("Routes", "  POST /api/overrides");
logger.info("Routes", "  GET  /api/overrides/history");

// ==========================================
// Module Exports
// ==========================================
module.exports = router;