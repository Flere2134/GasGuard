#include "mqtt_client.h"
#include <PubSubClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include "wifi_manager.h"
#include "../actuators/lcd_display.h"
#include "../actuators/servo_valve.h"
#include "../actuators/exhaust_fan.h"

// ==========================================
// MQTT Client Instance
// ==========================================
// PubSubClient wraps a WiFiClient to handle
// the MQTT protocol over the WiFi connection
// ==========================================
static WiFiClient   wifiClient;
static PubSubClient mqttClient(wifiClient);

// ==========================================
// Internal State
// ==========================================
static bool mqttConnected = false;

// Tracks last reconnect attempt time
static unsigned long lastReconnectAttempt = 0;

// ==========================================
// onMessageReceived()
// ==========================================
// Callback function triggered automatically
// by PubSubClient whenever a message arrives
// on a subscribed topic.
//
// Subscribed topics:
//   gasguard/command/fan   → {"state":"ON"} or {"state":"OFF"}
//   gasguard/command/valve → {"state":"OPEN"} or {"state":"CLOSE"}
//
// This is how the Vue dashboard sends remote
// override commands to the ESP32 hardware.
// ==========================================
static void onMessageReceived(char* topic, byte* payload, unsigned int length) {
  // Convert byte payload to a null-terminated string
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  Serial.printf("[MQTT] Message received on topic: %s\n", topic);
  Serial.printf("[MQTT] Payload: %s\n", message);

  // Parse the JSON payload
  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.printf("[MQTT] ERROR: Failed to parse JSON — %s\n", error.c_str());
    return;
  }

  const char* state = doc["state"];
  if (!state) {
    Serial.println("[MQTT] ERROR: No 'state' key found in payload.");
    return;
  }

  // --- Handle fan override command ---
  if (strcmp(topic, MQTT_TOPIC_CMD_FAN) == 0) {
    if (strcmp(state, "ON") == 0) {
      Serial.println("[MQTT] Override: Fan turned ON remotely.");
      startFan();
    } else if (strcmp(state, "OFF") == 0) {
      Serial.println("[MQTT] Override: Fan turned OFF remotely.");
      stopFan();
    } else {
      Serial.printf("[MQTT] ERROR: Unknown fan state: %s\n", state);
    }
  }

  // --- Handle valve override command ---
  else if (strcmp(topic, MQTT_TOPIC_CMD_VALVE) == 0) {
    if (strcmp(state, "CLOSE") == 0) {
      Serial.println("[MQTT] Override: Valve CLOSED remotely.");
      closeValve();
    } else if (strcmp(state, "OPEN") == 0) {
      Serial.println("[MQTT] Override: Valve OPENED remotely.");
      openValve();
    } else {
      Serial.printf("[MQTT] ERROR: Unknown valve state: %s\n", state);
    }
  }

  else {
    Serial.printf("[MQTT] WARNING: Unhandled topic: %s\n", topic);
  }
}

// ==========================================
// connectMQTT()
// ==========================================
// Sets up the MQTT broker connection using
// the host, port, and credentials in config.h
// Subscribes to override command topics after
// a successful connection.
//
// Returns true if connected, false if failed.
// ==========================================
bool connectMQTT() {
  Serial.println("[MQTT] Connecting to broker...");
  Serial.printf("[MQTT] Broker : %s:%d\n", MQTT_BROKER, MQTT_PORT);
  Serial.printf("[MQTT] Client ID: %s\n", MQTT_CLIENT_ID);

  // Configure broker host and port
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  // Register the incoming message callback
  mqttClient.setCallback(onMessageReceived);

  // Increase buffer size for JSON payloads
  mqttClient.setBufferSize(512);

  // Attempt connection with or without credentials
  bool connected = false;

  if (strlen(MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(
      MQTT_CLIENT_ID,
      MQTT_USERNAME,
      MQTT_PASSWORD
    );
  } else {
    connected = mqttClient.connect(MQTT_CLIENT_ID);
  }

  if (!connected) {
    Serial.printf("[MQTT] ERROR: Connection failed. State code: %d\n",
      mqttClient.state());
    Serial.println("[MQTT] Check broker IP, port, and credentials in config.h");

    lcdShowMQTTStatus(false);
    mqttConnected = false;
    return false;
  }

  // Subscribe to override command topics
  mqttClient.subscribe(MQTT_TOPIC_CMD_FAN);
  mqttClient.subscribe(MQTT_TOPIC_CMD_VALVE);

  Serial.println("[MQTT] Connected to broker successfully.");
  Serial.printf("[MQTT] Subscribed to: %s\n", MQTT_TOPIC_CMD_FAN);
  Serial.printf("[MQTT] Subscribed to: %s\n", MQTT_TOPIC_CMD_VALVE);

  lcdShowMQTTStatus(true);
  mqttConnected = true;
  return true;
}

// ==========================================
// maintainMQTT()
// ==========================================
// Must be called every loop() iteration.
// Does two things:
//   1. Calls mqttClient.loop() to process
//      incoming messages and keep the
//      broker connection alive (PINGREQ)
//   2. Attempts reconnection if the MQTT
//      connection has dropped, but only
//      if WiFi is still active
// ==========================================
void maintainMQTT() {
  if (mqttClient.connected()) {
    mqttConnected = true;
    mqttClient.loop(); // Process incoming messages
    return;
  }

  // MQTT disconnected
  mqttConnected = false;

  // No point trying MQTT without WiFi
  if (!isWiFiConnected()) {
    Serial.println("[MQTT] WiFi not connected — skipping MQTT reconnect.");
    return;
  }

  unsigned long now = millis();

  if (now - lastReconnectAttempt >= MQTT_RECONNECT_DELAY_MS) {
    lastReconnectAttempt = now;
    Serial.println("[MQTT] Connection lost. Attempting reconnect...");
    connectMQTT();
  }
}

// ==========================================
// publishTelemetry()
// ==========================================
// Builds and publishes a JSON telemetry
// payload to the gasguard/telemetry topic.
//
// Example payload:
// {
//   "device"    : "GasGuard-v1",
//   "ppm"       : 320.5,
//   "temp"      : 28.5,
//   "humidity"  : 65.0,
//   "status"    : "WARNING",
//   "valve"     : "OPEN",
//   "fan"       : "OFF",
//   "ip"        : "192.168.1.105",
//   "uptime"    : 3600
// }
// ==========================================
void publishTelemetry(float ppm, float temp,
                      float humidity, const char* status) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Cannot publish telemetry — not connected.");
    return;
  }

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["device"]  = DEVICE_NAME;
  doc["ppm"]     = ppm;
  doc["status"]  = status;
  doc["valve"]   = isValveClosed() ? "CLOSED" : "OPEN";
  doc["fan"]     = isFanRunning()  ? "ON"     : "OFF";
  doc["ip"]      = getIPAddress();
  doc["uptime"]  = millis() / 1000;

  if (temp == -999.0) {
    doc["temp"] = nullptr;
  } else {
    doc["temp"] = temp;
  }

  if (humidity == -999.0) {
    doc["humidity"] = nullptr;
  } else {
    doc["humidity"] = humidity;
  }

  char payload[256];
  serializeJson(doc, payload);

  bool published = mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload, false);

  if (published) {
    Serial.printf("[MQTT] Telemetry published → %s\n", payload);
  } else {
    Serial.println("[MQTT] ERROR: Failed to publish telemetry.");
  }
}

// ==========================================
// publishAlert()
// ==========================================
// Builds and publishes a JSON alert payload
// to the gasguard/alert topic.
// Only called on state transitions to avoid
// flooding the broker with repeated alerts.
//
// Example payload:
// {
//   "device"    : "GasGuard-v1",
//   "level"     : "DANGER",
//   "ppm"       : 650.0,
//   "valve"     : "CLOSED",
//   "fan"       : "ON",
//   "uptime"    : 3605
// }
// ==========================================
void publishAlert(const char* level, float ppm) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Cannot publish alert — not connected.");
    return;
  }

  StaticJsonDocument<128> doc;
  doc["device"] = DEVICE_NAME;
  doc["level"]  = level;
  doc["ppm"]    = ppm;
  doc["valve"]  = isValveClosed() ? "CLOSED" : "OPEN";
  doc["fan"]    = isFanRunning()  ? "ON"     : "OFF";
  doc["uptime"] = millis() / 1000;

  char payload[128];
  serializeJson(doc, payload);

  // Publish with retain=true so the backend
  // receives the last alert even if it connects
  // after the alert was first triggered
  bool published = mqttClient.publish(MQTT_TOPIC_ALERT, payload, true);

  if (published) {
    Serial.printf("[MQTT] Alert published → %s\n", payload);
  } else {
    Serial.println("[MQTT] ERROR: Failed to publish alert.");
  }
}

// ==========================================
// isMQTTConnected()
// ==========================================
// Returns true if the MQTT client is
// currently connected to the broker.
// ==========================================
bool isMQTTConnected() {
  return mqttClient.connected();
}