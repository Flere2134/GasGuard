#include "servo_valve.h"
#include <ESP32Servo.h>

// ==========================================
// Servo Instance
// ==========================================
static Servo valveServo;

// ==========================================
// Internal State
// ==========================================
static ValveState currentValveState = VALVE_OPEN;

// ==========================================
// LEDC Configuration for Servo PWM
// ==========================================
// ESP32Servo uses LEDC internally to generate
// the PWM signal needed to control the servo.
// We use LEDC channel 1 to avoid conflict
// with the buzzer which uses channel 0.
//
// Standard servo PWM parameters:
//   Frequency  : 50 Hz (20ms period)
//   Min pulse  : 500  microseconds (0°)
//   Max pulse  : 2400 microseconds (180°)
// ==========================================
static const int SERVO_LEDC_CHANNEL = 1;
static const int SERVO_MIN_US       = 500;
static const int SERVO_MAX_US       = 2400;

// Delay between each degree of movement
// during gradual sweep — controls sweep speed
// Lower = faster, Higher = slower and smoother
static const int SWEEP_DELAY_MS = 15;

// ==========================================
// sweepTo()
// ==========================================
// Internal helper that moves the servo
// gradually from its current position to
// the target angle one degree at a time.
//
// This prevents the sudden mechanical jerk
// that occurs when jumping directly to the
// target angle — important for a valve
// attached to a gas fitting to avoid
// mechanical stress on the connection.
// ==========================================
static void sweepTo(int targetAngle) {
  int currentAngle = valveServo.read();

  Serial.printf("[SERVO] Sweeping from %d° to %d°\n",
    currentAngle, targetAngle);

  if (currentAngle < targetAngle) {
    // Sweep forward (increasing angle)
    for (int angle = currentAngle; angle <= targetAngle; angle++) {
      valveServo.write(angle);
      delay(SWEEP_DELAY_MS);
    }
  } else {
    // Sweep backward (decreasing angle)
    for (int angle = currentAngle; angle >= targetAngle; angle--) {
      valveServo.write(angle);
      delay(SWEEP_DELAY_MS);
    }
  }

  Serial.printf("[SERVO] Reached target angle: %d°\n", targetAngle);
}

// ==========================================
// initServoValve()
// ==========================================
// Allocates a LEDC timer for the servo,
// attaches the servo to the signal pin,
// and sets the valve to OPEN on boot.
//
// The valve should always start OPEN so
// normal gas flow is not interrupted when
// the system powers up or reboots.
// ==========================================
void initServoValve() {
  // Allocate a timer for the servo PWM
  ESP32PWM::allocateTimer(SERVO_LEDC_CHANNEL);

  // Set PWM parameters for standard servo
  valveServo.setPeriodHertz(50);
  valveServo.attach(PIN_SERVO, SERVO_MIN_US, SERVO_MAX_US);

  Serial.println("[SERVO] Servo valve initialized.");
  Serial.printf("[SERVO] Pin: GPIO %d\n", PIN_SERVO);
  Serial.printf("[SERVO] Open angle : %d°\n", SERVO_ANGLE_OPEN);
  Serial.printf("[SERVO] Close angle: %d°\n", SERVO_ANGLE_CLOSE);

  // Set valve to OPEN position on startup
  Serial.println("[SERVO] Setting valve to OPEN position on boot...");
  valveServo.write(SERVO_ANGLE_OPEN);
  currentValveState = VALVE_OPEN;
  delay(500); // Allow servo to physically reach position

  Serial.println("[SERVO] Valve is OPEN. System ready.");
}

// ==========================================
// openValve()
// ==========================================
// Gradually sweeps the servo to the OPEN
// angle defined in config.h.
//
// Only moves if the valve is not already
// open to avoid unnecessary mechanical wear.
// ==========================================
void openValve() {
  if (currentValveState == VALVE_OPEN) {
    return; // Already open — do nothing
  }

  Serial.println("[SERVO] Opening valve...");
  sweepTo(SERVO_ANGLE_OPEN);

  currentValveState = VALVE_OPEN;
  Serial.println("[SERVO] Valve is now OPEN.");
}

// ==========================================
// closeValve()
// ==========================================
// Gradually sweeps the servo to the CLOSED
// angle defined in config.h.
//
// This is the critical safety action —
// called immediately when DANGER is detected.
// A confirmation message is printed to Serial
// so the team can verify it triggered correctly
// during testing.
//
// Only moves if the valve is not already
// closed to avoid unnecessary mechanical wear.
// ==========================================
void closeValve() {
  if (currentValveState == VALVE_CLOSED) {
    return; // Already closed — do nothing
  }

  Serial.println("[SERVO] *** CLOSING VALVE — GAS LEAK DETECTED ***");
  sweepTo(SERVO_ANGLE_CLOSE);

  currentValveState = VALVE_CLOSED;
  Serial.println("[SERVO] *** VALVE IS NOW CLOSED — GAS SUPPLY CUT OFF ***");
}

// ==========================================
// getValveState()
// ==========================================
// Returns the current valve state enum.
// Used by mqtt_client to include valve
// status in telemetry payloads.
// ==========================================
ValveState getValveState() {
  return currentValveState;
}

// ==========================================
// isValveClosed()
// ==========================================
// Convenience function that returns true
// if the valve is currently in CLOSED state.
// Useful for dashboard status reporting
// and MQTT payload construction.
// ==========================================
bool isValveClosed() {
  return currentValveState == VALVE_CLOSED;
}