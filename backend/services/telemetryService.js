// ==========================================
// services/telemetryService.js
// ==========================================
// Handles incoming telemetry payloads from
// the ESP32 firmware published to:
//   gasguard/telemetry
//
// Responsibilities:
//   - Validate incoming payload fields
//   - Store latest snapshot to Firestore
//   - Update device registry in Firestore
//   - Expose latest snapshot for API routes
// ==========================================

const { getDB, COLLECTIONS } = require("../config/firebase");
const { registerHandler }    = require("../config/mqtt");
const logger                 = require("../utils/logger");

// ==========================================
// Internal State
// ==========================================
// Caches the latest telemetry payload in
// memory so the status API route can return
// it instantly without a Firestore read
// ==========================================
let latestTelemetry = null;

// ==========================================
// Required Payload Fields
// ==========================================
// Every telemetry payload from the ESP32
// must contain these fields to be valid.
// Payloads missing any of these are rejected.
// ==========================================
const REQUIRED_FIELDS = [
  "device",
  "ppm",
  "status",
  "valve",
  "fan",
  "uptime",
];

// ==========================================
// validatePayload()
// ==========================================
// Checks that all required fields are
// present and that key values are within
// reasonable ranges.
//
// Returns { valid: true } or
//         { valid: false, reason: "..." }
// ==========================================
function validatePayload(payload) {
  // Check all required fields exist
  for (const field of REQUIRED_FIELDS) {
    if (payload[field] === undefined || payload[field] === null) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }

  // Validate PPM is a non-negative number
  const ppm = parseFloat(payload.ppm);
  if (isNaN(ppm) || ppm < 0) {
    return { valid: false, reason: `Invalid PPM value: ${payload.ppm}` };
  }

  // Validate status is one of the expected values
  const validStatuses = ["SAFE", "WARNING", "DANGER"];
  if (!validStatuses.includes(payload.status)) {
    return { valid: false, reason: `Invalid status: ${payload.status}` };
  }

  // Validate valve state
  const validValveStates = ["OPEN", "CLOSED"];
  if (!validValveStates.includes(payload.valve)) {
    return { valid: false, reason: `Invalid valve state: ${payload.valve}` };
  }

  // Validate fan state
  const validFanStates = ["ON", "OFF"];
  if (!validFanStates.includes(payload.fan)) {
    return { valid: false, reason: `Invalid fan state: ${payload.fan}` };
  }

  return { valid: true };
}

// ==========================================
// handleTelemetry()
// ==========================================
// Main handler called by mqtt.js whenever
// a message arrives on gasguard/telemetry.
//
// Flow:
//   1. Validate the payload
//   2. Cache in memory (latestTelemetry)
//   3. Write latest snapshot to Firestore
//   4. Update device registry
// ==========================================
async function handleTelemetry(topic, payload) {
  logger.debug("Telemetry", "Payload received.", payload);

  // Step 1 — Validate
  const validation = validatePayload(payload);
  if (!validation.valid) {
    logger.warn("Telemetry", `Invalid payload rejected: ${validation.reason}`, payload);
    return;
  }

  // Step 2 — Enrich payload with server timestamp
  const enriched = {
    ...payload,
    ppm:       parseFloat(payload.ppm),
    temp:      payload.temp      ? parseFloat(payload.temp)      : null,
    humidity:  payload.humidity  ? parseFloat(payload.humidity)  : null,
    uptime:    parseInt(payload.uptime),
    serverTimestamp: new Date().toISOString(),
  };

  // Step 3 — Cache in memory
  latestTelemetry = enriched;

  // Step 4 — Write to Firestore
  try {
    const db = getDB();

    // Overwrite the single "latest" document
    // with the most recent sensor snapshot
    await db
      .collection(COLLECTIONS.TELEMETRY)
      .doc("latest")
      .set(enriched);

    logger.debug("Telemetry", "Latest snapshot saved to Firestore.");

    // Step 5 — Update device registry
    await db
      .collection(COLLECTIONS.DEVICES)
      .doc(payload.device)
      .set({
        ip:       payload.ip      || null,
        uptime:   enriched.uptime,
        status:   payload.status,
        lastSeen: enriched.serverTimestamp,
      }, { merge: true }); // merge: true preserves existing fields

    logger.debug("Telemetry", `Device registry updated for: ${payload.device}`);

  } catch (err) {
    logger.error("Telemetry", "Failed to write to Firestore.", err.message);
  }
}

// ==========================================
// getLatestTelemetry()
// ==========================================
// Returns the most recent telemetry snapshot
// from the in-memory cache.
//
// Used by routes/status.js to serve the
// GET /api/status endpoint instantly without
// hitting Firestore on every request.
//
// Returns null if no data has been received
// since the server started.
// ==========================================
function getLatestTelemetry() {
  return latestTelemetry;
}

// ==========================================
// initTelemetryService()
// ==========================================
// Registers the telemetry handler with the
// MQTT router. Called once in server.js
// after initMQTT() completes.
// ==========================================
function initTelemetryService() {
  registerHandler("gasguard/telemetry", handleTelemetry);
  logger.info("Telemetry", "Service initialized. Listening on gasguard/telemetry");
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  initTelemetryService,
  getLatestTelemetry,
};