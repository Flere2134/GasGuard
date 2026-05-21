// ==========================================
// services/overrideService.js
// ==========================================
// Handles manual override commands sent
// from the Vue dashboard to the ESP32.
//
// Responsibilities:
//   - Validate override command requests
//   - Publish commands to MQTT broker
//   - Log override actions to Firestore
//   - Track override history in memory
// ==========================================

const { publish }            = require("../config/mqtt");
const { getDB, COLLECTIONS } = require("../config/firebase");
const logger                 = require("../utils/logger");

// ==========================================
// Valid Override Commands
// ==========================================
// Maps each device to its valid states.
// Used for validation before publishing.
// ==========================================
const VALID_COMMANDS = {
  fan:   ["ON",    "OFF"  ],
  valve: ["OPEN",  "CLOSE"],
};

// MQTT topics for each override command
const COMMAND_TOPICS = {
  fan:   "gasguard/command/fan",
  valve: "gasguard/command/valve",
};

// ==========================================
// In-Memory Override History
// ==========================================
const MAX_HISTORY = 20;
let overrideHistory = [];

// ==========================================
// sendOverride()
// ==========================================
// Validates and publishes an override
// command to the MQTT broker.
//
// Parameters:
//   device  — "fan" or "valve"
//   state   — the target state string
//   issuedBy — user ID or "system"
//
// Returns:
//   { success: true,  message: "..." }
//   { success: false, message: "..." }
// ==========================================
async function sendOverride(device, state, issuedBy = "dashboard") {

  // Step 1 — Validate device type
  if (!VALID_COMMANDS[device]) {
    const msg = `Unknown device: "${device}". Valid: fan, valve.`;
    logger.warn("Override", msg);
    return { success: false, message: msg };
  }

  // Step 2 — Validate state for device
  if (!VALID_COMMANDS[device].includes(state)) {
    const msg = `Invalid state "${state}" for device "${device}". ` +
                `Valid: ${VALID_COMMANDS[device].join(", ")}`;
    logger.warn("Override", msg);
    return { success: false, message: msg };
  }

  const topic   = COMMAND_TOPICS[device];
  const payload = { state };

  // Step 3 — Publish to MQTT broker
  const published = publish(topic, payload);

  if (!published) {
    const msg = "Failed to publish override — MQTT not connected.";
    logger.error("Override", msg);
    return { success: false, message: msg };
  }

  logger.info("Override", `Command sent — Device: ${device} | State: ${state} | By: ${issuedBy}`);

  // Step 4 — Build override record
  const record = {
    device,
    state,
    issuedBy,
    topic,
    timestamp: new Date().toISOString(),
    success: true,
  };

  // Step 5 — Add to in-memory history
  overrideHistory.unshift(record);
  if (overrideHistory.length > MAX_HISTORY) {
    overrideHistory = overrideHistory.slice(0, MAX_HISTORY);
  }

  // Step 6 — Log to Firestore
  try {
    const db = getDB();
    await db
      .collection(COLLECTIONS.ALERTS)
      .add({
        type:      "OVERRIDE",
        device,
        state,
        issuedBy,
        timestamp: record.timestamp,
      });

    logger.debug("Override", "Override action logged to Firestore.");

  } catch (err) {
    // Non-critical — command already sent to ESP32
    // Just log the Firestore error and continue
    logger.warn("Override", "Failed to log override to Firestore.", err.message);
  }

  return {
    success: true,
    message: `Override sent: ${device} → ${state}`,
    record,
  };
}

// ==========================================
// getOverrideHistory()
// ==========================================
// Returns the in-memory override history.
// Used by routes/overrides.js to show
// the last N override commands on the
// Vue dashboard log panel.
// ==========================================
function getOverrideHistory() {
  return overrideHistory;
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  sendOverride,
  getOverrideHistory,
};