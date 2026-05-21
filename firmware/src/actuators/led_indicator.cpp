#include "led_indicator.h"

// ==========================================
// Internal State
// ==========================================
static LEDState currentLEDState = LED_SAFE;

// ==========================================
// initLEDs()
// ==========================================
// Sets all three LED pins as OUTPUT and
// runs a startup test sequence so the team
// can visually confirm all LEDs are wired
// and working correctly on boot.
//
// Startup sequence:
//   1. All LEDs ON  for 500ms
//   2. All LEDs OFF for 300ms
//   3. Green  ON    for 300ms then OFF
//   4. Yellow ON    for 300ms then OFF
//   5. Red    ON    for 300ms then OFF
//   6. All OFF — ready
// ==========================================
void initLEDs() {
  pinMode(PIN_LED_GREEN,  OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED,    OUTPUT);

  Serial.println("[LED] Pins initialized.");
  Serial.println("[LED] Running startup test sequence...");

  // Step 1 — All ON
  allLEDsOn();
  delay(500);

  // Step 2 — All OFF
  allLEDsOff();
  delay(300);

  // Step 3 — Green
  digitalWrite(PIN_LED_GREEN, HIGH);
  Serial.println("[LED] Green ON");
  delay(300);
  digitalWrite(PIN_LED_GREEN, LOW);

  // Step 4 — Yellow
  digitalWrite(PIN_LED_YELLOW, HIGH);
  Serial.println("[LED] Yellow ON");
  delay(300);
  digitalWrite(PIN_LED_YELLOW, LOW);

  // Step 5 — Red
  digitalWrite(PIN_LED_RED, HIGH);
  Serial.println("[LED] Red ON");
  delay(300);
  digitalWrite(PIN_LED_RED, LOW);

  // Step 6 — All OFF, ready
  allLEDsOff();
  Serial.println("[LED] Startup test complete. All LEDs OFF.");
}

// ==========================================
// setLEDState()
// ==========================================
// Turns ON only the LED that corresponds
// to the current alert state, and turns
// OFF the other two LEDs.
//
// Only one LED should ever be ON at a time
// to clearly communicate the system status.
// ==========================================
void setLEDState(LEDState state) {

  // Avoid redundant writes if state hasn't changed
  if (state == currentLEDState) return;

  currentLEDState = state;

  // Always turn all off first to avoid
  // brief overlap during transition
  allLEDsOff();

  switch (state) {
    case LED_SAFE:
      digitalWrite(PIN_LED_GREEN, HIGH);
      Serial.println("[LED] State → SAFE (Green ON)");
      break;

    case LED_WARNING:
      digitalWrite(PIN_LED_YELLOW, HIGH);
      Serial.println("[LED] State → WARNING (Yellow ON)");
      break;

    case LED_DANGER:
      digitalWrite(PIN_LED_RED, HIGH);
      Serial.println("[LED] State → DANGER (Red ON)");
      break;

    default:
      Serial.println("[LED] ERROR: Unknown LED state received.");
      break;
  }
}

// ==========================================
// allLEDsOff()
// ==========================================
// Turns all three LEDs OFF.
// Called before switching states and
// during system shutdown or reset.
// ==========================================
void allLEDsOff() {
  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED,    LOW);
}

// ==========================================
// allLEDsOn()
// ==========================================
// Turns all three LEDs ON simultaneously.
// Used only during the startup test sequence
// to verify all three LEDs are functional.
// ==========================================
void allLEDsOn() {
  digitalWrite(PIN_LED_GREEN,  HIGH);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  digitalWrite(PIN_LED_RED,    HIGH);
}

// ==========================================
// getCurrentLEDState()
// ==========================================
// Returns the currently active LED state.
// Can be used by other modules to check
// the current visual status of the system
// without needing to track it separately.
// ==========================================
LEDState getCurrentLEDState() {
  return currentLEDState;
}