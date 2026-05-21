#ifndef DHT22_H
#define DHT22_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Initializes the DHT22 sensor
// Must be called once in setup()
void initDHT22();

// Reads and returns the current temperature in Celsius
// Returns -999.0 if the reading fails
float readDHT22Temperature();

// Reads and returns the current relative humidity in percentage
// Returns -999.0 if the reading fails
float readDHT22Humidity();

// Returns true if the last reading was valid
// Use this to check before trusting the values
bool isDHT22ReadingValid();

#endif // DHT22_H