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
  Serial.println("[WiFi] Starting connection procedure...");
  Serial.printf("[WiFi] Target SSID: %s\n", WIFI_SSID);

  // Set to Station mode
  WiFi.mode(WIFI_STA);
  
  // A short delay can help some hotspots stabilize
  delay(100); 

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();
  Serial.print("[WiFi] Attempting to connect");

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - startTime >= WIFI_TIMEOUT_MS) {
      Serial.println();
      Serial.printf("[WiFi] ERROR: Connection failed after %d ms.\n", WIFI_TIMEOUT_MS);
      Serial.println("[WiFi] IMPORTANT: If using iPhone, enable 'Maximize Compatibility' in Hotspot settings.");
      Serial.printf("[WiFi] Status Code: %d\n", WiFi.status());

      lcdShowWiFiStatus(WIFI_SSID, false);
      wifiConnected = false;
      return false;
    }

    delay(1000); // 1 second between dots
    Serial.print(".");
    
    // Periodically print the status code to help diagnosis
    if ((millis() - startTime) % 5000 < 1000) {
        Serial.printf("(Status: %d)", WiFi.status());
    }
  }

  Serial.println();
  Serial.println("[WiFi] CONNECTED!");
  Serial.printf("[WiFi] IP: %s | RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());

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