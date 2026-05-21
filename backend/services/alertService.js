// ==========================================
// services/alertService.js
// ==========================================
// Handles incoming alert payloads from the
// ESP32 firmware published to:
//   gasguard/alert
//
// Responsibilities:
//   - Validate incoming alert payloads
//   - Persist alert events to Firestore
//   - Maintain an in-memory alert log
//   - Expose alert history for API routes
// ==========================================

const { getDB, COLLECTIONS } = require("../config/firebase");
const { registerHandler }    = require("../config/mqtt");
const logger                 = require("../utils/logger");

// ==========================================
// Internal State
// ==========================================
// In-memory cache of recent alerts.
// Capped at MAX_CACHED_ALERTS entries to
// prevent unbounded memory growth during
// long uptime periods.
// ==========================================
const MAX_CACHED_ALERTS = 50;
let alertCache = [];

// ==========================================
// validateAlert()
// ==========================================
// Validates the incoming alert payload has
// all required fields with valid values.
//
// Returns { valid: true } or
//         { valid: false, reason: "..." }
// ==========================================
function validateAlert(payload) {
  if (!payload.device) {
    return { valid: false, reason: "Missing field: device" };
  }

  if (!payload.level) {
    return { valid: false, reason: "Missing field: level" };
  }

  const validLevels = ["WARNING", "DANGER"];
  if (!validLevels.includes(payload.level)) {
    return { valid: false, reason: `Invalid alert level: ${payload.level}` };
  }

  const ppm = parseFloat(payload.ppm);
  if (isNaN(ppm) || ppm < 0) {
    return { valid: false, reason: `Invalid PPM value: ${payload.ppm}` };
  }

  return { valid: true };
}

// ==========================================
// handleAlert()
// ==========================================
// Main handler called by mqtt.js whenever
// a message arrives on gasguard/alert.
//
// Flow:
//   1. Validate the alert payload
//   2. Enrich with server timestamp
//   3. Add to in-memory cache
//   4. Persist to Firestore alerts collection
// ==========================================
async function handleAlert(topic, payload) {
  logger.warn("Alert", `Alert received — Level: ${payload.level} | PPM: ${payload.ppm}`);
  logger.debug("Alert", "Full alert payload.", payload);

  // Step 1 — Validate
  const validation = validateAlert(payload);
  if (!validation.valid) {
    logger.warn("Alert", `Invalid alert rejected: ${validation.reason}`, payload);
    return;
  }

  // Step 2 — Enrich with server-side timestamp
  const alertRecord = {
    device:          payload.device,
    level:           payload.level,
    ppm:             parseFloat(payload.ppm),
    valve:           payload.valve  || "UNKNOWN",
    fan:             payload.fan    || "UNKNOWN",
    uptime:          parseInt(payload.uptime) || 0,
    serverTimestamp: new Date().toISOString(),
  };

  // Step 3 — Add to in-memory cache
  alertCache.unshift(alertRecord); // Add to front (most recent first)

  // Trim cache if it exceeds the limit
  if (alertCache.length > MAX_CACHED_ALERTS) {
    alertCache = alertCache.slice(0, MAX_CACHED_ALERTS);
  }

  logger.debug("Alert", `Cache size: ${alertCache.length}/${MAX_CACHED_ALERTS}`);

  // Step 4 — Persist to Firestore
  try {
    const db = getDB();

    // Add a new document with auto-generated ID
    // Each alert is stored as a separate document
    // so the full history is preserved
    const docRef = await db
      .collection(COLLECTIONS.ALERTS)
      .add(alertRecord);

    logger.info("Alert", `Alert saved to Firestore. Doc ID: ${docRef.id}`, {
      level: alertRecord.level,
      ppm:   alertRecord.ppm,
    });

  } catch (err) {
    logger.error("Alert", "Failed to save alert to Firestore.", err.message);
  }
}

// ==========================================
// getAlertCache()
// ==========================================
// Returns the in-memory alert cache array.
// Used by routes/alerts.js for the
// GET /api/alerts endpoint.
//
// Returns most recent alerts first.
// ==========================================
function getAlertCache() {
  return alertCache;
}

// ==========================================
// getAlertsFromFirestore()
// ==========================================
// Fetches alert history directly from
// Firestore with optional limit and
// level filter.
//
// Used when the full historical log is
// needed beyond what is cached in memory.
//
// Parameters:
//   limit — max number of alerts to return (default 20)
//   level — filter by "WARNING" or "DANGER" (optional)
// ==========================================
async function getAlertsFromFirestore(limit = 20, level = null) {
  try {
    const db = getDB();

    let query = db
      .collection(COLLECTIONS.ALERTS)
      .orderBy("serverTimestamp", "desc")
      .limit(limit);

    // Apply level filter if provided
    if (level && ["WARNING", "DANGER"].includes(level)) {
      query = query.where("level", "==", level);
    }

    const snapshot = await query.get();

    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.debug("Alert", `Fetched ${alerts.length} alerts from Firestore.`);
    return alerts;

  } catch (err) {
    logger.error("Alert", "Failed to fetch alerts from Firestore.", err.message);
    throw err;
  }
}

// ==========================================
// initAlertService()
// ==========================================
// Registers the alert handler with the
// MQTT router. Called once in server.js
// after initMQTT() completes.
// ==========================================
function initAlertService() {
  registerHandler("gasguard/alert", handleAlert);
  logger.info("Alert", "Service initialized. Listening on gasguard/alert");
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  initAlertService,
  getAlertCache,
  getAlertsFromFirestore,
};