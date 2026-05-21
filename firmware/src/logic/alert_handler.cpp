#include "alert_handler.h"

// ==========================================
// Internal State Tracking
// ==========================================
static AlertState currentState  = ALERT_SAFE;
static AlertState previousState = ALERT_SAFE;
static bool       stateChanged  = false;

// ==========================================
// evaluateAlertState()
// ==========================================
// Reads the current PPM value and determines
// which alert state the system should be in.
//
// Uses hysteresis to prevent rapid flickering
// between states when PPM hovers near a threshold.
//
// Hysteresis margin: 10 PPM
// Example: WARNING triggers at 200 PPM
//          but only clears back to SAFE at 190 PPM
// ==========================================
AlertState evaluateAlertState(float ppm) {
  previousState = currentState;

  // --- Determine new state based on PPM ---
  if (ppm >= GAS_THRESHOLD_CRITICAL) {
    currentState = ALERT_DANGER;

  } else if (ppm >= GAS_THRESHOLD_WARNING) {
    currentState = ALERT_WARNING;

  } else {
    // Apply hysteresis — only return to SAFE if PPM
    // has dropped 10 PPM below the WARNING threshold
    if (currentState == ALERT_WARNING && ppm > (GAS_THRESHOLD_WARNING - 10)) {
      currentState = ALERT_WARNING; // Hold WARNING state until clearly below threshold
    } else {
      currentState = ALERT_SAFE;
    }
  }

  // --- Detect state change ---
  stateChanged = (currentState != previousState);

  // --- Log state transitions to Serial ---
  if (stateChanged) {
    Serial.printf("[ALERT] State changed: %s → %s (%.2f PPM)\n",
      alertStateToString(previousState),
      alertStateToString(currentState),
      ppm
    );
  }

  return currentState;
}

// ==========================================
// alertStateToString()
// ==========================================
// Converts AlertState enum to a string label
// used in MQTT payloads and LCD messages
// ==========================================
const char* alertStateToString(AlertState state) {
  switch (state) {
    case ALERT_SAFE:    return STATUS_SAFE;
    case ALERT_WARNING: return STATUS_WARNING;
    case ALERT_DANGER:  return STATUS_DANGER;
    default:            return "UNKNOWN";
  }
}

// ==========================================
// getPreviousAlertState()
// ==========================================
// Returns the alert state from the previous
// sensor reading cycle
// ==========================================
AlertState getPreviousAlertState() {
  return previousState;
}

// ==========================================
// alertStateChanged()
// ==========================================
// Returns true if the state changed during
// the most recent evaluateAlertState() call.
// Useful for triggering one-time actions on
// state transitions (e.g. publishing an alert
// only once when DANGER is first detected)
// ==========================================
bool alertStateChanged() {
  return stateChanged;
}