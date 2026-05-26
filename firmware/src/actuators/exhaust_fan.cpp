#include "exhaust_fan.h"

// ==========================================
// Internal State
// ==========================================
static FanState currentFanState = FAN_OFF;

// ==========================================
// initExhaustFan()
// ==========================================
// Sets the relay control pin as OUTPUT and
// ensures the fan starts in the OFF state
// on every boot.
//
// Most relay modules are active LOW meaning:
//   LOW  signal → relay energized → fan ON
//   HIGH signal → relay open      → fan OFF
//
// RELAY_ON and RELAY_OFF are defined in
// config.h to handle this clearly without
// having to remember the active LOW logic
// throughout the codebase.
//
// A startup relay test is performed to
// confirm the relay clicks and the fan
// briefly spins — verifying the wiring
// is correct before real operation begins.
// ==========================================
void initExhaustFan() {
  pinMode(PIN_RELAY_FAN, OUTPUT);

  // Ensure fan is OFF on boot
  digitalWrite(PIN_RELAY_FAN, RELAY_ON);
  currentFanState = FAN_OFF;

  Serial.println("[FAN] Exhaust fan relay initialized.");
  Serial.printf("[FAN] Relay pin : GPIO %d\n", PIN_RELAY_FAN);
  Serial.printf("[FAN] RELAY_ON  = %s | RELAY_OFF = %s\n",
    RELAY_ON == LOW ? "LOW" : "HIGH",
    RELAY_OFF == LOW ? "LOW" : "HIGH"
  );

  // --- Startup Relay Test ---
  // Briefly activates the relay to confirm
  // it clicks and the fan responds correctly.
  // The fan will spin for 500ms then stop.
  Serial.println("[FAN] Running startup relay test (500ms)...");
  digitalWrite(PIN_RELAY_FAN, RELAY_OFF);
  delay(500);
  digitalWrite(PIN_RELAY_FAN, RELAY_ON);
  Serial.println("[FAN] Startup test complete. Fan is OFF.");
}

// ==========================================
// startFan()
// ==========================================
// Energizes the relay to start the exhaust
// fan. Only activates if the fan is not
// already running to avoid redundant relay
// switching which causes unnecessary wear.
//
// Called by main.cpp when DANGER state
// is detected to ventilate the area and
// reduce gas concentration.
// ==========================================
void startFan() {
  if (currentFanState == FAN_ON) {
    return; // Already running — do nothing
  }

  digitalWrite(PIN_RELAY_FAN, RELAY_OFF);
  currentFanState = FAN_ON;

  Serial.println("[FAN] *** FAN STARTED — Ventilating area ***");
}

// ==========================================
// stopFan()
// ==========================================
// De-energizes the relay to stop the exhaust
// fan. Only deactivates if the fan is
// currently running.
//
// Called by main.cpp when the system
// returns to SAFE or WARNING state.
//
// Note: The fan should only stop once PPM
// has clearly dropped back to SAFE levels.
// The alert_handler hysteresis ensures this
// so stopFan() is not called prematurely.
// ==========================================
void stopFan() {
  if (currentFanState == FAN_OFF) {
    return; // Already stopped — do nothing
  }

  digitalWrite(PIN_RELAY_FAN, RELAY_ON);
  currentFanState = FAN_OFF;

  Serial.println("[FAN] Fan stopped.");
}

// ==========================================
// getFanState()
// ==========================================
// Returns the current fan state enum.
// Used by mqtt_client to include fan
// status in telemetry MQTT payloads so
// the dashboard can display whether the
// fan is currently running or not.
// ==========================================
FanState getFanState() {
  return currentFanState;
}

// ==========================================
// isFanRunning()
// ==========================================
// Convenience function that returns true
// if the fan is currently ON.
// Used for status checks and MQTT payload
// construction without exposing the enum.
// ==========================================
bool isFanRunning() {
  return currentFanState == FAN_ON;
}