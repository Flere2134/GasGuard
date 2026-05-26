#include "servo_valve.h"
#include <ESP32Servo.h>

static Servo valveServo;
static ValveState currentValveState = VALVE_OPEN;

static const int SERVO_LEDC_CHANNEL = 1;
static const int SERVO_MIN_US       = 500;
static const int SERVO_MAX_US       = 2400;

// Adjust these milliseconds based on how long it takes your physical valve to turn
static const int TIME_TO_OPEN_MS  = 1000; 
static const int TIME_TO_CLOSE_MS = 1000;

void initServoValve() {
  ESP32PWM::allocateTimer(SERVO_LEDC_CHANNEL);
  valveServo.setPeriodHertz(50);
  valveServo.attach(PIN_SERVO, SERVO_MIN_US, SERVO_MAX_US);

  Serial.println("[SERVO] Servo valve initialized.");
  
  // 90 is the STOP command for a 360-degree continuous servo
  valveServo.write(90); 
  currentValveState = VALVE_OPEN;

  Serial.println("[SERVO] Valve is OPEN (Stopped). System ready.");
}

void openValve() {
  if (currentValveState == VALVE_OPEN) return;

  Serial.println("[SERVO] Opening valve...");
  
  // Spin forward
  valveServo.write(180); 
  delay(TIME_TO_OPEN_MS);
  
  // Stop spinning
  valveServo.write(90);  

  currentValveState = VALVE_OPEN;
  Serial.println("[SERVO] Valve is now OPEN.");
}

void closeValve() {
  if (currentValveState == VALVE_CLOSED) return;

  Serial.println("[SERVO] *** CLOSING VALVE — GAS LEAK DETECTED ***");
  
  // Spin backward
  valveServo.write(0); 
  delay(TIME_TO_CLOSE_MS);
  
  // Stop spinning
  valveServo.write(90); 

  currentValveState = VALVE_CLOSED;
  Serial.println("[SERVO] *** VALVE IS NOW CLOSED — GAS SUPPLY CUT OFF ***");
}

ValveState getValveState() {
  return currentValveState;
}

bool isValveClosed() {
  return currentValveState == VALVE_CLOSED;
}