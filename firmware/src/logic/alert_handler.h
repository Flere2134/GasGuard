#ifndef ALERT_HANDLER_H
#define ALERT_HANDLER_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Alert State Enum
// ==========================================
// Represents the three possible system states
// based on the gas PPM reading from the MQ-6
// ==========================================
typedef enum {
  ALERT_SAFE    = 0,  // PPM below WARNING threshold  — all clear
  ALERT_WARNING = 1,  // PPM above WARNING threshold  — caution
  ALERT_DANGER  = 2   // PPM above CRITICAL threshold — immediate action
} AlertState;

// ==========================================
// Function Declarations
// ==========================================

// Evaluates the current PPM reading and returns
// the corresponding AlertState (SAFE/WARNING/DANGER)
AlertState evaluateAlertState(float ppm);

// Converts an AlertState enum value to its
// human-readable string equivalent for MQTT payloads
const char* alertStateToString(AlertState state);

// Returns the previous alert state
// Useful for detecting state transitions
AlertState getPreviousAlertState();

// Returns true if the alert state has changed
// since the last sensor reading
bool alertStateChanged();

#endif // ALERT_HANDLER_H