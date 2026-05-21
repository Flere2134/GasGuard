#ifndef EXHAUST_FAN_H
#define EXHAUST_FAN_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Fan State Enum
// ==========================================
typedef enum {
  FAN_OFF = 0,  // Relay open   — fan is not running
  FAN_ON  = 1   // Relay closed — fan is running
} FanState;

// ==========================================
// Function Declarations
// ==========================================

// Initializes the relay pin as OUTPUT
// and ensures the fan starts in OFF state
void initExhaustFan();

// Activates the relay to turn the fan ON
// Called when DANGER state is detected
void startFan();

// Deactivates the relay to turn the fan OFF
// Called when system returns to SAFE state
void stopFan();

// Returns the current fan state
FanState getFanState();

// Returns true if the fan is currently running
bool isFanRunning();

#endif // EXHAUST_FAN_H