#ifndef BUZZER_H
#define BUZZER_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Initializes the buzzer pin as OUTPUT
// and runs a short startup beep to confirm
// the buzzer is functional
void initBuzzer();

// Plays a short single beep pattern
// Used for WARNING state — intermittent beeping
// to alert without being too aggressive
void buzzerWarning();

// Plays a rapid continuous beep pattern
// Used for DANGER state — urgent alarm tone
// to demand immediate attention
void buzzerDanger();

// Plays a short single confirmation beep
// Used for system events like boot ready,
// valve closed confirmation, etc.
void buzzerBeep(int durationMs);

// Stops the buzzer immediately
// Called when returning to SAFE state
void stopBuzzer();

// Returns true if the buzzer is currently active
bool isBuzzerActive();

#endif // BUZZER_H