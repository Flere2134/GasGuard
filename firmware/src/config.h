#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// WiFi Configuration
// ==========================================
#define WIFI_SSID         "Xiaomi Arboleda Fam"  // Replace with your WiFi SSID
#define WIFI_PASSWORD     "A052620H"  // Replace with your WiFi password
#define WIFI_TIMEOUT_MS   15000       // 15 seconds before WiFi connection times out

// ==========================================
// MQTT Configuration
// ==========================================
#define MQTT_BROKER       "broker.hivemq.com" //IP address or hostname of your MQTT broker
#define MQTT_PORT         1883
#define MQTT_CLIENT_ID    "gasguard-esp32"
#define MQTT_USERNAME     ""  // Leave blank if no auth: ""
#define MQTT_PASSWORD     ""  // Leave blank if no auth: ""

// MQTT Topics — Publish (ESP32 → Broker)
#define MQTT_TOPIC_TELEMETRY   "gasguard/telemetry"  // Sensor data (ppm, temp, humidity, status)
#define MQTT_TOPIC_ALERT       "gasguard/alert"       // Alert events (level, ppm, timestamp)

// MQTT Topics — Subscribe (Broker → ESP32)
#define MQTT_TOPIC_CMD_FAN     "gasguard/command/fan"    // {"state":"ON"} or {"state":"OFF"}
#define MQTT_TOPIC_CMD_VALVE   "gasguard/command/valve"  // {"state":"OPEN"} or {"state":"CLOSE"}

#define MQTT_RECONNECT_DELAY_MS  5000  // 5 seconds between reconnect attempts

// ==========================================
// GPIO Pin Definitions
// ==========================================

// --- Sensors ---
#define PIN_MQ6_ANALOG     34   // MQ-6 Analog Output   (ADC input only)
#define PIN_DHT22          4    // DHT22 Data Pin

// --- I2C LCD Display ---
#define PIN_LCD_SDA        21   // I2C SDA
#define PIN_LCD_SCL        22   // I2C SCL
#define LCD_I2C_ADDRESS    0x27 // Default PCF8574 I2C address (try 0x3F if 0x27 doesn't work)
#define LCD_COLUMNS        16   // Change to 20 if using 20x4 LCD
#define LCD_ROWS           2    // Change to 4 if using 20x4 LCD

// --- Servo Motor (Valve) ---
#define PIN_SERVO          13   // Servo Signal Pin
#define SERVO_ANGLE_OPEN   0    // Angle in degrees for valve OPEN position
#define SERVO_ANGLE_CLOSE  90   // Angle in degrees for valve CLOSED position

// --- Relay (Exhaust Fan) ---
#define PIN_RELAY_FAN      27   // Relay IN Signal Pin
#define RELAY_ON           LOW  // Most relay modules activate on LOW signal
#define RELAY_OFF          HIGH

// --- Piezo Buzzer ---
#define PIN_BUZZER         26   // Buzzer Signal Pin

// --- LEDs ---
#define PIN_LED_GREEN      25   // Green LED  — SAFE state
#define PIN_LED_YELLOW     33   // Yellow LED — WARNING state
#define PIN_LED_RED        32   // Red LED    — DANGER state

// ==========================================
// Gas Threshold Levels (PPM)
// ==========================================
#define GAS_THRESHOLD_WARNING   200   // PPM — triggers WARNING state
#define GAS_THRESHOLD_CRITICAL  500   // PPM — triggers DANGER state and mitigations

// MQ-6 ADC Calibration
// These values depend on your specific sensor and environment.
// Calibrate these after physical sensor warm-up (allow 24-48 hours burn-in for new MQ-6)
#define MQ6_RL_VALUE        10    // Load resistance on the MQ-6 board in kΩ (usually 10kΩ)
#define MQ6_RO_CLEAN_AIR    9.83  // Sensor resistance ratio in clean air (calibrate this value)
#define MQ6_ADC_MAX         4095  // ESP32 ADC is 12-bit (0–4095)
#define MQ6_VCC             3.3   // ESP32 ADC reference voltage

// ==========================================
// Sensor Reading Interval
// ==========================================
#define SENSOR_READ_INTERVAL_MS   2000  // Read sensors every 2 seconds
#define MQTT_PUBLISH_INTERVAL_MS  2000  // Publish telemetry every 2 seconds

// ==========================================
// Alert Status Labels
// ==========================================
#define STATUS_SAFE       "SAFE"
#define STATUS_WARNING    "WARNING"
#define STATUS_DANGER     "DANGER"

// ==========================================
// System Info
// ==========================================
#define DEVICE_NAME       "GasGuard-v1"
#define FIRMWARE_VERSION  "1.0.0"

#endif // CONFIG_H