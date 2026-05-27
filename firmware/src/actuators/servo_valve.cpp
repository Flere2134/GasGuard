#include "servo_valve.h"
#include <ESP32Servo.h>

// ==========================================
// Servo Instance & State
// ==========================================
static Servo valveServo;
static ValveState currentValveState = VALVE_OPEN;

// ==========================================
// LEDC Configuration
// ==========================================
static const int SERVO_LEDC_CHANNEL = 1;
static const int SERVO_MIN_US       = 500;
static const int SERVO_MAX_US       = 2400;

// ==========================================
// Calibration Variables (Dead Reckoning)
// ==========================================
// IMPORTANT: You must manually calibrate these numbers!
// These define exactly how long the motor spins. 
// For example, if 450ms turns the valve exactly 90 degrees, set it to 450.
static const int TIME_TO_OPEN_MS  = 250; 
static const int TIME_TO_CLOSE_MS = 170;

// ==========================================
// haltAndDetachServo()
// ==========================================
// Stops the motor and kills the PWM signal to
// avoid continuous creeping or stalling.
// ==========================================
static void haltAndDetachServo() {
  valveServo.write(90); // 90 is the theoretical stop point for 360 servos
  delay(300);            // Brief pause to let the motor brake
  valveServo.detach();  // Cut the signal entirely
  Serial.println("[SERVO] Signal detached. Motor locked in position.");
}

// ==========================================
// initServoValve()
// ==========================================
void initServoValve() {
  ESP32PWM::allocateTimer(SERVO_LEDC_CHANNEL);
  valveServo.setPeriodHertz(50);
  
  Serial.println("[SERVO] Servo valve initialized.");
  
  // Assume the physical valve starts in the OPEN position on boot
  currentValveState = VALVE_OPEN;
  
  Serial.println("[SERVO] Valve is assumed OPEN (Idle). System ready.");
}

// ==========================================
// openValve()
// ==========================================
void openValve() {
  if (currentValveState == VALVE_OPEN) return;

  Serial.println("[SERVO] Opening valve...");
  
  // 1. Re-attach the signal
  valveServo.attach(PIN_SERVO, SERVO_MIN_US, SERVO_MAX_US);
  
  // 2. Spin forward (adjust 180 to a lower number like 110 for slower speed)
  valveServo.write(10); 
  
  // 3. Wait for the precise calibrated time
  delay(TIME_TO_OPEN_MS);
  
  // 4. Stop and detach
  haltAndDetachServo();

  currentValveState = VALVE_OPEN;
  Serial.println("[SERVO] Valve is now OPEN.");
}

// ==========================================
// closeValve()
// ==========================================
void closeValve() {
  if (currentValveState == VALVE_CLOSED) return;

  Serial.println("[SERVO] *** CLOSING VALVE — GAS LEAK DETECTED ***");
  
  // 1. Re-attach the signal
  valveServo.attach(PIN_SERVO, SERVO_MIN_US, SERVO_MAX_US);
  
  // 2. Spin backward (adjust 0 to a higher number like 70 for slower speed)
  valveServo.write(0); 
  
  // 3. Wait for the precise calibrated time
  delay(TIME_TO_CLOSE_MS);
  
  // 4. Stop and detach
  haltAndDetachServo();

  currentValveState = VALVE_CLOSED;
  Serial.println("[SERVO] *** VALVE IS NOW CLOSED — GAS SUPPLY CUT OFF ***");
}

// ==========================================
// State Getters
// ==========================================
ValveState getValveState() {
  return currentValveState;
}

bool isValveClosed() {
  return currentValveState == VALVE_CLOSED;
}