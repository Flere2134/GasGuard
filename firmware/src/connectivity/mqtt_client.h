#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Connects to the MQTT broker defined in config.h
// Returns true if connection succeeded
bool connectMQTT();

// Maintains the MQTT connection and processes
// incoming messages. Must be called every loop()
void maintainMQTT();

// Publishes sensor telemetry to MQTT
// Topic: gasguard/telemetry
// Payload: JSON with ppm, temp, humidity,
//          status, valve state, fan state
void publishTelemetry(float ppm, float temp,
                      float humidity, const char* status);

// Publishes an alert event to MQTT
// Topic: gasguard/alert
// Payload: JSON with alert level, ppm, timestamp
void publishAlert(const char* level, float ppm);

// Returns true if MQTT is currently connected
bool isMQTTConnected();

#endif // MQTT_CLIENT_H