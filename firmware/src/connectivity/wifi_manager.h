#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Connects to WiFi using credentials in config.h
// Blocks until connected or timeout is reached
// Returns true if connection succeeded
bool connectWiFi();

// Checks if WiFi is currently connected
// and attempts reconnection if it dropped
// Call this periodically in the main loop
void maintainWiFi();

// Returns true if WiFi is currently connected
bool isWiFiConnected();

// Returns the device's local IP address as a string
String getIPAddress();

#endif // WIFI_MANAGER_H