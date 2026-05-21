#include "dht22.h"
#include <DHT.h>

// ==========================================
// DHT22 Sensor Instance
// ==========================================
// DHT type is set to DHT22.
// PIN_DHT22 and DHT22 type are defined
// in config.h and the DHT library respectively
// ==========================================
static DHT dht(PIN_DHT22, DHT22);

// ==========================================
// Internal State
// ==========================================
static bool lastReadingValid = false;

// Minimum interval between DHT22 readings
// The DHT22 hardware only updates every 2 seconds.
// Reading faster than this returns stale data.
static const unsigned long DHT22_MIN_INTERVAL_MS = 2000;
static unsigned long lastReadTime = 0;

// Cached values from the last successful read
// Avoids hammering the sensor with repeated reads
static float cachedTemperature = 0.0;
static float cachedHumidity    = 0.0;

// ==========================================
// initDHT22()
// ==========================================
// Starts the DHT library and prints
// confirmation to the Serial Monitor.
// No pin mode setup is needed — the DHT
// library handles that internally.
// ==========================================
void initDHT22() {
  dht.begin();

  Serial.println("[DHT22] Sensor initialized.");
  Serial.printf("[DHT22] Data pin: GPIO %d\n", PIN_DHT22);
  Serial.println("[DHT22] Minimum read interval: 2 seconds");
}

// ==========================================
// performRead()
// ==========================================
// Internal helper that reads both temperature
// and humidity from the DHT22 and caches
// the results. Respects the 2-second minimum
// interval to avoid stale or failed reads.
// ==========================================
static void performRead() {
  unsigned long now = millis();

  // Only read if enough time has passed
  if (now - lastReadTime < DHT22_MIN_INTERVAL_MS) {
    return; // Return early — use cached values
  }

  lastReadTime = now;

  float temp     = dht.readTemperature();  // Celsius by default
  float humidity = dht.readHumidity();

  // isnan() checks if the value is "Not a Number"
  // which is what the DHT library returns on a failed read
  if (isnan(temp) || isnan(humidity)) {
    lastReadingValid = false;
    Serial.println("[DHT22] ERROR: Failed to read sensor. Check wiring.");
    return;
  }

  // Cache the valid readings
  cachedTemperature = temp;
  cachedHumidity    = humidity;
  lastReadingValid  = true;

  Serial.printf("[DHT22] Temperature: %.2f °C | Humidity: %.2f %%\n",
    cachedTemperature, cachedHumidity);
}

// ==========================================
// readDHT22Temperature()
// ==========================================
// Returns the current temperature in Celsius.
// Returns -999.0 if the read fails so the
// caller can detect and handle the error.
// ==========================================
float readDHT22Temperature() {
  performRead();

  if (!lastReadingValid) {
    return -999.0;
  }

  return cachedTemperature;
}

// ==========================================
// readDHT22Humidity()
// ==========================================
// Returns the current relative humidity in %.
// Returns -999.0 if the read fails so the
// caller can detect and handle the error.
// ==========================================
float readDHT22Humidity() {
  performRead();

  if (!lastReadingValid) {
    return -999.0;
  }

  return cachedHumidity;
}

// ==========================================
// isDHT22ReadingValid()
// ==========================================
// Returns true if the last sensor read
// was successful. Use this in main.cpp
// before trusting the temperature and
// humidity values for MQTT publishing.
// ==========================================
bool isDHT22ReadingValid() {
  return lastReadingValid;
}