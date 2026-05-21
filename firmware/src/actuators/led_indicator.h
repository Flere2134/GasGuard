#ifndef LED_INDICATOR_H
#define LED_INDICATOR_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// LED State Enum
// ==========================================
// Represents which LED state the system
// should display based on the alert level
// ==========================================
typedef enum {
  LED_SAFE    = 0,  // Green LED ON  — system is clear
  LED_WARNING = 1,  // Yellow LED ON — gas detected, caution
  LED_DANGER  = 2   // Red LED ON    — critical gas level
} LEDState;

// ==========================================
// Function Declarations
// ==========================================

// Initializes all LED pins as OUTPUT
// and turns them all OFF at startup
void initLEDs();

// Sets the LED state based on the alert level
// Turns ON the correct LED and turns OFF the others
void setLEDState(LEDState state);

// Turns all LEDs OFF
void allLEDsOff();

// Turns all LEDs ON — useful for startup test
void allLEDsOn();

// Returns the currently active LED state
LEDState getCurrentLEDState();

#endif // LED_INDICATOR_H