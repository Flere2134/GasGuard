#include <Arduino.h>
#include "config.h"
#include "sensors/mq6.h"
#include "sensors/dht22.h"
#include "actuators/servo_valve.h"
#include "actuators/exhaust_fan.h"
#include "actuators/buzzer.h"
#include "actuators/led_indicator.h"
#include "actuators/lcd_display.h"
#include "connectivity/wifi_manager.h"
#include "connectivity/mqtt_client.h"
#include "logic/alert_handler.h"

// Timing Variables
unsigned long lastSensorReadTime  = 0;
unsigned long lastMqttPublishTime = 0;

// Setup
void setup() {
  Serial.begin(115200);
  Serial.println("  GasGuard System Starting...");
  Serial.println("  " + String(DEVICE_NAME) + " v" + String(FIRMWARE_VERSION));

  // --- Initialize Actuators ---
  initLEDs();
  initBuzzer();
  initServoValve();
  initExhaustFan();
  initLCD();

  // --- Show Boot Screen on LCD ---
  lcdShowBoot();

  // --- Initialize Sensors ---
  initMQ6();
  initDHT22();

  // --- Connect to WiFi ---
  lcdShowMessage("Connecting...", "WiFi");
  connectWiFi();

  // --- Connect to MQTT Broker ---
  lcdShowMessage("Connecting...", "MQTT Broker");
  connectMQTT();

  // --- System Ready ---
  Serial.println("[SYSTEM] GasGuard is ready.");
  lcdShowMessage("System Ready", "GasGuard v1.0");
  setLEDState(LED_SAFE);
  delay(2000);
}

// Main Loop
void loop() {
  unsigned long currentTime = millis();

  // --- Maintain MQTT Connection ---
  maintainMQTT();

  // --- Read Sensors at Interval ---
  if (currentTime - lastSensorReadTime >= SENSOR_READ_INTERVAL_MS) {
    lastSensorReadTime = currentTime;

    // Read sensor values
    float ppm      = readMQ6PPM();
    float temp     = readDHT22Temperature();
    float humidity = readDHT22Humidity();

    // Print to Serial Monitor for debugging
    Serial.println("------ Sensor Reading ------");
    Serial.printf("[MQ-6]  Gas Level : %.2f PPM\n", ppm);
    Serial.printf("[DHT22] Temperature: %.2f °C\n", temp);
    Serial.printf("[DHT22] Humidity   : %.2f %%\n", humidity);

    // --- Evaluate Alert State ---
    AlertState state = evaluateAlertState(ppm);

    // --- Execute Local Response Based on State ---
    switch (state) {

      case ALERT_SAFE:
        Serial.println("[STATUS] SAFE");
        setLEDState(LED_SAFE);
        stopBuzzer();
        openValve();
        stopFan();
        lcdShowStatus(STATUS_SAFE, ppm, temp, humidity);
        break;

      case ALERT_WARNING:
        Serial.println("[STATUS] WARNING");
        setLEDState(LED_WARNING);
        buzzerWarning();
        openValve();
        stopFan();
        lcdShowStatus(STATUS_WARNING, ppm, temp, humidity);
        break;

      case ALERT_DANGER:
        Serial.println("[STATUS] DANGER — Executing mitigations...");
        setLEDState(LED_DANGER);
        buzzerDanger();
        closeValve();
        startFan();
        lcdShowStatus(STATUS_DANGER, ppm, temp, humidity);
        break;
    }

    // --- Publish Telemetry to MQTT ---
    if (currentTime - lastMqttPublishTime >= MQTT_PUBLISH_INTERVAL_MS) {
      lastMqttPublishTime = currentTime;

      publishTelemetry(ppm, temp, humidity, alertStateToString(state));

      if (state == ALERT_DANGER || state == ALERT_WARNING) {
        publishAlert(alertStateToString(state), ppm);
      }
    }
  }
}