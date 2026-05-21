#ifndef SERVO_VALVE_H
#define SERVO_VALVE_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Valve State Enum
// ==========================================
typedef enum {
  VALVE_OPEN   = 0,  // Servo at SERVO_ANGLE_OPEN   — gas can flow
  VALVE_CLOSED = 1   // Servo at SERVO_ANGLE_CLOSE  — gas is cut off
} ValveState;

// ==========================================
// Function Declarations
// ==========================================

// Initializes the servo motor and sets
// the valve to the OPEN position on boot
void initServoValve();

// Rotates the servo to the OPEN position
// Called when system returns to SAFE state
void openValve();

// Rotates the servo to the CLOSED position
// Called immediately on DANGER state detection
void closeValve();

// Returns the current valve state
ValveState getValveState();

// Returns true if the valve is currently closed
bool isValveClosed();

#endif // SERVO_VALVE_H