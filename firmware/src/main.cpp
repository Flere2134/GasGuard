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
static AlertState previousState = (AlertState)-1;

// Setup
void setup() {
  Serial.begin(115200);
  Serial.println("  GasGuard System Starting...");
  Serial.println("  " + String(DEVICE_NAME) + " v" + String(FIRMWARE_VERSION));
  //float ro = calibrateMQ6();

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

    // Read sensor values and floor the data results
    float ppm      = floor(readMQ6PPM());
    float temp     = floor(readDHT22Temperature());
    float humidity = floor(readDHT22Humidity());

    // Print to Serial Monitor for debugging
    Serial.println("------ Sensor Reading ------");
    Serial.printf("[MQ-6]  Gas Level : %.2f PPM\n", ppm);
    Serial.printf("[DHT22] Temperature: %.2f °C\n", temp);
    Serial.printf("[DHT22] Humidity   : %.2f %%\n", humidity);

    // --- Evaluate Alert State ---
    AlertState currentState = evaluateAlertState(ppm);

    // --- Execute Local Response ONLY on State Change ---
    if (currentState != previousState) {
      previousState = currentState;

      switch (currentState) {
        case ALERT_SAFE:
          Serial.println("[STATUS] Transition to SAFE");
          setLEDState(LED_SAFE);
          stopBuzzer();
          openValve();
          stopFan();
          break;

        case ALERT_WARNING:
          Serial.println("[STATUS] Transition to WARNING");
          setLEDState(LED_WARNING);
          buzzerWarning();
          openValve();
          stopFan();
          break;

        case ALERT_DANGER:
          Serial.println("[STATUS] Transition to DANGER — Executing mitigations...");
          setLEDState(LED_DANGER);
          buzzerDanger();
          closeValve();
          startFan();
          break;
      }
    }

    // --- Always update the LCD with fresh sensor readings ---
    // (This happens every loop so the screen numbers stay live)
    if (currentState == ALERT_SAFE)        lcdShowStatus(STATUS_SAFE, ppm, temp, humidity);
    else if (currentState == ALERT_WARNING) lcdShowStatus(STATUS_WARNING, ppm, temp, humidity);
    else if (currentState == ALERT_DANGER)  lcdShowStatus(STATUS_DANGER, ppm, temp, humidity);

    // --- Publish Telemetry to MQTT ---
    if (currentTime - lastMqttPublishTime >= MQTT_PUBLISH_INTERVAL_MS) {
      lastMqttPublishTime = currentTime;

      publishTelemetry(ppm, temp, humidity, alertStateToString(currentState));

      if (currentState == ALERT_DANGER || currentState == ALERT_WARNING) {
        publishAlert(alertStateToString(currentState), ppm);
      }
    }
  }
}