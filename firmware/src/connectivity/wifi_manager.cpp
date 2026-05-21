#include "wifi_manager.h"
#include "../actuators/lcd_display.h"

// ==========================================
// Internal State
// ==========================================
static bool wifiConnected = false;

// Tracks the last time a reconnect was attempted
// to avoid hammering the WiFi stack with
// repeated connection attempts every loop cycle
static unsigned long lastReconnectAttempt = 0;

// ==========================================
// connectWiFi()
// ==========================================
// Initiates a WiFi connection using the
// SSID and password defined in config.h.
//
// Connection flow:
//   1. Set ESP32 to Station mode (STA)
//   2. Begin connection attempt
//   3. Wait up to WIFI_TIMEOUT_MS (10s)
//      printing dots to Serial each 500ms
//   4. Report success or failure
//
// Returns true if connected, false if timed out.
// ==========================================
bool connectWiFi() {
  Serial.println("[WiFi] Starting connection...");
  Serial.printf("[WiFi] SSID: %s\n", WIFI_SSID);

  // Set to Station mode — connects to a router
  // (not AP mode which creates its own network)
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();

  Serial.print("[WiFi] Connecting");

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime >= WIFI_TIMEOUT_MS) {
      // Timeout reached — connection failed
      Serial.println();
      Serial.println("[WiFi] ERROR: Connection timed out.");
      Serial.println("[WiFi] Check SSID and password in config.h");

      lcdShowWiFiStatus(WIFI_SSID, false);
      wifiConnected = false;
      return false;
    }

    delay(500);
    Serial.print(".");
  }

  // Connection successful
  Serial.println();
  Serial.println("[WiFi] Connected successfully.");
  Serial.printf("[WiFi] IP Address : %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[WiFi] Signal RSSI: %d dBm\n", WiFi.RSSI());

  lcdShowWiFiStatus(WIFI_SSID, true);
  wifiConnected = true;
  return true;
}

// ==========================================
// maintainWiFi()
// ==========================================
// Monitors the WiFi connection and triggers
// a reconnect if the connection drops.
//
// Called every loop() iteration from main.cpp
// but only actually attempts reconnection
// once every MQTT_RECONNECT_DELAY_MS (5s)
// to avoid flooding the WiFi stack.
//
// Common reasons WiFi drops mid-operation:
//   - Router restarted
//   - ESP32 moved out of range temporarily
//   - Network congestion causing timeout
// ==========================================
void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    return; // All good — nothing to do
  }

  // WiFi has dropped
  wifiConnected = false;
  unsigned long now = millis();

  if (now - lastReconnectAttempt >= MQTT_RECONNECT_DELAY_MS) {
    lastReconnectAttempt = now;

    Serial.println("[WiFi] Connection lost. Attempting reconnect...");
    WiFi.disconnect();
    WiFi.reconnect();
  }
}

// ==========================================
// isWiFiConnected()
// ==========================================
// Returns true if WiFi is currently connected.
// Used by mqtt_client before attempting
// to publish or maintain MQTT connection
// since MQTT requires an active WiFi link.
// ==========================================
bool isWiFiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

// ==========================================
// getIPAddress()
// ==========================================
// Returns the ESP32's current local IP
// address as a String.
// Printed to Serial on boot and can be
// included in MQTT telemetry payloads for
// device identification on the dashboard.
// ==========================================
String getIPAddress() {
  return WiFi.localIP().toString();
}