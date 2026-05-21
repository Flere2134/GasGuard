// ==========================================
// routes/status.js
// ==========================================
// Handles GET /api/status
//
// Returns the latest sensor snapshot
// including gas PPM, temperature, humidity,
// alert status, valve state, and fan state.
//
// This is the primary endpoint polled by
// the Vue dashboard to update the live
// gauges and status indicators.
// ==========================================

const express               = require("express");
const router                = express.Router();
const { getLatestTelemetry} = require("../services/telemetryService");
const { isMQTTConnected }   = require("../config/mqtt");
const { verifyToken }       = require("../middleware/auth");
const logger                = require("../utils/logger");

// ==========================================
// GET /api/status
// ==========================================
// Returns the latest telemetry snapshot
// from the in-memory cache.
//
// Response (200 OK):
// {
//   "success": true,
//   "connected": true,
//   "data": {
//     "device"          : "GasGuard-v1",
//     "ppm"             : 320.5,
//     "temp"            : 28.5,
//     "humidity"        : 65.0,
//     "status"          : "WARNING",
//     "valve"           : "OPEN",
//     "fan"             : "OFF",
//     "ip"              : "192.168.1.105",
//     "uptime"          : 3600,
//     "serverTimestamp" : "2024-01-15T14:32:05.000Z"
//   }
// }
//
// Response (503) when no data received yet:
// {
//   "success"  : false,
//   "connected": false,
//   "error"    : "No telemetry data received yet."
// }
// ==========================================
router.get("/", verifyToken, (req, res) => {
  logger.debug("Route:Status", `GET /api/status — user: ${req.user.email || req.user.uid}`);

  const telemetry   = getLatestTelemetry();
  const mqttOnline  = isMQTTConnected();

  // No data received yet — ESP32 may not be
  // connected or backend just started up
  if (!telemetry) {
    logger.warn("Route:Status", "No telemetry data available yet.");
    return res.status(503).json({
      success:   false,
      connected: mqttOnline,
      error:     "No telemetry data received yet. Ensure the ESP32 is powered and connected.",
    });
  }

  return res.status(200).json({
    success:   true,
    connected: mqttOnline,
    data:      telemetry,
  });
});

// ==========================================
// GET /api/status/health
// ==========================================
// Public health check endpoint — no auth.
// Returns the backend and MQTT connection
// status. Used for monitoring and uptime
// checks without requiring a login token.
//
// Response (200 OK):
// {
//   "success" : true,
//   "backend" : "online",
//   "mqtt"    : "connected",
//   "uptime"  : 3600
// }
// ==========================================
router.get("/health", (req, res) => {
  const mqttOnline = isMQTTConnected();

  logger.debug("Route:Status", "GET /api/status/health");

  return res.status(200).json({
    success : true,
    backend : "online",
    mqtt    : mqttOnline ? "connected" : "disconnected",
    uptime  : Math.floor(process.uptime()),
  });
});

module.exports = router;