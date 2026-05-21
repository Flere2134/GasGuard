#ifndef MQ6_H
#define MQ6_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Initializes the MQ-6 sensor pin
// and performs initial warm-up read
void initMQ6();

// Reads the raw ADC value from the MQ-6 sensor
// Returns a value between 0 and 4095
int readMQ6Raw();

// Calculates the sensor resistance (Rs)
// based on the raw ADC reading
float calculateRs(int rawADC);

// Calculates the PPM value from the Rs/Ro ratio
// using the MQ-6 LPG curve approximation
float calculatePPM(float rs);

// Main function called in loop —
// returns the current LPG concentration in PPM
float readMQ6PPM();

// Calibrates Ro in clean air
// Call this once during setup in a clean environment
// Returns the calculated Ro value
float calibrateMQ6();

#endif // MQ6_H