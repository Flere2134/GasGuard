// ==========================================
// routes/alerts.js
// ==========================================
// Handles all alert-related API endpoints.
//
// Endpoints:
//   GET /api/alerts          — recent alert log
//   GET /api/alerts/history  — full Firestore history
// ==========================================

const express                                    = require("express");
const router                                     = express.Router();
const { getAlertCache, getAlertsFromFirestore }  = require("../services/alertService");
const { verifyToken }                            = require("../middleware/auth");
const logger                                     = require("../utils/logger");

// ==========================================
// GET /api/alerts
// ==========================================
// Returns the in-memory alert cache.
// Fast response — no Firestore read needed.
// Returns the most recent alerts first.
//
// Optional query params:
//   ?limit=10       — max alerts to return (default 20)
//   ?level=DANGER   — filter by WARNING or DANGER
//
// Response (200 OK):
// {
//   "success" : true,
//   "count"   : 3,
//   "data"    : [
//     {
//       "device"          : "GasGuard-v1",
//       "level"           : "DANGER",
//       "ppm"             : 650.0,
//       "valve"           : "CLOSED",
//       "fan"             : "ON",
//       "uptime"          : 3605,
//       "serverTimestamp" : "2024-01-15T14:32:05.000Z"
//     },
//     ...
//   ]
// }
// ==========================================
router.get("/", verifyToken, (req, res) => {
  logger.debug("Route:Alerts", `GET /api/alerts — user: ${req.user.email || req.user.uid}`);

  // Parse query parameters
  const limit = parseInt(req.query.limit) || 20;
  const level = req.query.level ? req.query.level.toUpperCase() : null;

  // Validate limit
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error:   "limit must be between 1 and 100.",
    });
  }

  // Validate level filter if provided
  if (level && !["WARNING", "DANGER"].includes(level)) {
    return res.status(400).json({
      success: false,
      error:   `Invalid level filter: "${level}". Use WARNING or DANGER.`,
    });
  }

  // Get from in-memory cache
  let alerts = getAlertCache();

  // Apply level filter if provided
  if (level) {
    alerts = alerts.filter((a) => a.level === level);
  }

  // Apply limit
  alerts = alerts.slice(0, limit);

  logger.debug("Route:Alerts", `Returning ${alerts.length} alerts from cache.`);

  return res.status(200).json({
    success : true,
    count   : alerts.length,
    source  : "cache",
    data    : alerts,
  });
});

// ==========================================
// GET /api/alerts/history
// ==========================================
// Returns full alert history from Firestore.
// Slower than /api/alerts but returns the
// complete historical log beyond what is
// cached in memory.
//
// Optional query params:
//   ?limit=50       — max alerts (default 20, max 100)
//   ?level=DANGER   — filter by WARNING or DANGER
//
// Response (200 OK):
// {
//   "success" : true,
//   "count"   : 50,
//   "source"  : "firestore",
//   "data"    : [ ... ]
// }
// ==========================================
router.get("/history", verifyToken, async (req, res, next) => {
  logger.debug("Route:Alerts", `GET /api/alerts/history — user: ${req.user.email || req.user.uid}`);

  const limit = parseInt(req.query.limit) || 20;
  const level = req.query.level ? req.query.level.toUpperCase() : null;

  // Validate limit
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error:   "limit must be between 1 and 100.",
    });
  }

  // Validate level if provided
  if (level && !["WARNING", "DANGER"].includes(level)) {
    return res.status(400).json({
      success: false,
      error:   `Invalid level: "${level}". Use WARNING or DANGER.`,
    });
  }

  try {
    const alerts = await getAlertsFromFirestore(limit, level);

    logger.debug("Route:Alerts", `Returning ${alerts.length} alerts from Firestore.`);

    return res.status(200).json({
      success : true,
      count   : alerts.length,
      source  : "firestore",
      data    : alerts,
    });

  } catch (err) {
    // Pass to centralized error handler
    next(err);
  }
});

module.exports = router;