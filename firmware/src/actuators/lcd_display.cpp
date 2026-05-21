#include "lcd_display.h"
#include <LiquidCrystal_I2C.h>

// ==========================================
// LCD Instance
// ==========================================
// Parameters:
//   LCD_I2C_ADDRESS — I2C address (0x27 or 0x3F)
//   LCD_COLUMNS     — number of columns (16 or 20)
//   LCD_ROWS        — number of rows (2 or 4)
// All three are defined in config.h
// ==========================================
static LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, LCD_COLUMNS, LCD_ROWS);

// ==========================================
// Custom Characters
// ==========================================
// The LCD supports up to 8 custom 5x8 pixel
// characters stored in CGRAM slots 0–7.
// We define three symbols for visual clarity:
//   Slot 0 — Checkmark ✓ (SAFE)
//   Slot 1 — Warning   ! (WARNING)
//   Slot 2 — Danger    X (DANGER)
// ==========================================
static byte charCheck[8] = {
  0b00000,
  0b00001,
  0b00011,
  0b10110,
  0b11100,
  0b01000,
  0b00000,
  0b00000
};

static byte charWarn[8] = {
  0b00100,
  0b00100,
  0b00100,
  0b00100,
  0b00100,
  0b00000,
  0b00100,
  0b00000
};

static byte charDanger[8] = {
  0b10001,
  0b01010,
  0b00100,
  0b00100,
  0b01010,
  0b10001,
  0b00000,
  0b00000
};

// ==========================================
// initLCD()
// ==========================================
// Initializes the LCD over I2C, loads the
// custom characters into CGRAM, turns on
// the backlight, and confirms on Serial.
//
// If the LCD shows nothing after init:
//   1. Check I2C wiring (SDA=21, SCL=22)
//   2. Try changing LCD_I2C_ADDRESS in
//      config.h from 0x27 to 0x3F
//   3. Run an I2C scanner sketch to find
//      the correct address of your module
// ==========================================
void initLCD() {
  lcd.init();
  lcd.backlight();

  // Load custom characters into CGRAM
  lcd.createChar(0, charCheck);
  lcd.createChar(1, charWarn);
  lcd.createChar(2, charDanger);

  lcd.clear();

  Serial.println("[LCD] Display initialized.");
  Serial.printf("[LCD] I2C Address : 0x%02X\n", LCD_I2C_ADDRESS);
  Serial.printf("[LCD] Size        : %dx%d\n", LCD_COLUMNS, LCD_ROWS);
}

// ==========================================
// lcdShowBoot()
// ==========================================
// Displays the startup splash screen.
// Shown briefly during boot before WiFi
// and MQTT connection messages appear.
//
// Display output (16x2):
//   ┌────────────────┐
//   │   GasGuard     │
//   │  System v1.0   │
//   └────────────────┘
// ==========================================
void lcdShowBoot() {
  lcd.clear();
  lcd.setCursor(3, 0);
  lcd.print("GasGuard");
  lcd.setCursor(2, 1);
  lcd.print("System v");
  lcd.print(FIRMWARE_VERSION);

  Serial.println("[LCD] Boot screen displayed.");
  delay(2000);
}

// ==========================================
// lcdShowMessage()
// ==========================================
// Displays a simple two line message.
// Used for connection status screens and
// any general system notification.
//
// Display output example:
//   ┌────────────────┐
//   │ Connecting...  │
//   │ WiFi           │
//   └────────────────┘
// ==========================================
void lcdShowMessage(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);

  Serial.printf("[LCD] Message: \"%s\" | \"%s\"\n", line1, line2);
}

// ==========================================
// lcdShowStatus()
// ==========================================
// The main operating screen displayed during
// continuous monitoring. Updates every sensor
// read cycle with the latest values.
//
// Display output — SAFE state (16x2):
//   ┌────────────────┐
//   │✓SAFE  PPM:0045 │
//   │T:28.5C H:065%  │
//   └────────────────┘
//
// Display output — WARNING state (16x2):
//   ┌────────────────┐
//   │!WARN  PPM:0245 │
//   │T:29.0C H:068%  │
//   └────────────────┘
//
// Display output — DANGER state (16x2):
//   ┌────────────────┐
//   │XDANGER PPM:0650│
//   │T:30.1C H:070%  │
//   └────────────────┘
//
// PPM is zero-padded to 4 digits for
// consistent column alignment as values
// change during monitoring.
// ==========================================
void lcdShowStatus(const char* status, float ppm,
                   float temp, float humidity) {
  lcd.clear();

  // --- Line 1: Status + PPM ---
  lcd.setCursor(0, 0);

  // Print custom status icon
  if (strcmp(status, STATUS_SAFE) == 0) {
    lcd.write(byte(0));       // Checkmark ✓
    lcd.print("SAFE  ");
  } else if (strcmp(status, STATUS_WARNING) == 0) {
    lcd.write(byte(1));       // Warning !
    lcd.print("WARN  ");
  } else {
    lcd.write(byte(2));       // Danger X
    lcd.print("DANGER ");
  }

  // Print PPM — zero padded to 4 digits
  lcd.print("PPM:");
  if (ppm < 10)    lcd.print("000");
  else if (ppm < 100)  lcd.print("00");
  else if (ppm < 1000) lcd.print("0");
  lcd.print((int)ppm);

  // --- Line 2: Temperature + Humidity ---
  lcd.setCursor(0, 1);
  lcd.print("T:");

  // Handle failed DHT22 read (-999.0)
  if (temp == -999.0) {
    lcd.print("ERR ");
  } else {
    lcd.print(temp, 1);  // 1 decimal place
    lcd.print("C ");
  }

  lcd.print("H:");

  if (humidity == -999.0) {
    lcd.print("ERR%");
  } else {
    // Zero pad humidity to 3 digits
    if (humidity < 10)  lcd.print("0");
    if (humidity < 100) lcd.print("0");
    lcd.print((int)humidity);
    lcd.print("%");
  }
}

// ==========================================
// lcdShowWiFiStatus()
// ==========================================
// Displays the WiFi connection result.
// Called after connectWiFi() completes.
//
// Display output — connected:
//   ┌────────────────┐
//   │WiFi Connected! │
//   │MyNetwork       │
//   └────────────────┘
//
// Display output — failed:
//   ┌────────────────┐
//   │WiFi FAILED     │
//   │Check Settings  │
//   └────────────────┘
// ==========================================
void lcdShowWiFiStatus(const char* ssid, bool connected) {
  lcd.clear();
  lcd.setCursor(0, 0);

  if (connected) {
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    // Truncate SSID to 16 characters for display
    char truncSSID[17];
    strncpy(truncSSID, ssid, 16);
    truncSSID[16] = '\0';
    lcd.print(truncSSID);
    Serial.printf("[LCD] WiFi connected to: %s\n", ssid);
  } else {
    lcd.print("WiFi FAILED");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");
    Serial.println("[LCD] WiFi connection failed.");
  }

  delay(2000);
}

// ==========================================
// lcdShowMQTTStatus()
// ==========================================
// Displays the MQTT broker connection result.
// Called after connectMQTT() completes.
//
// Display output — connected:
//   ┌────────────────┐
//   │MQTT Connected! │
//   │Broker Ready    │
//   └────────────────┘
//
// Display output — failed:
//   ┌────────────────┐
//   │MQTT FAILED     │
//   │Check Broker IP │
//   └────────────────┘
// ==========================================
void lcdShowMQTTStatus(bool connected) {
  lcd.clear();
  lcd.setCursor(0, 0);

  if (connected) {
    lcd.print("MQTT Connected!");
    lcd.setCursor(0, 1);
    lcd.print("Broker Ready");
    Serial.println("[LCD] MQTT broker connected.");
  } else {
    lcd.print("MQTT FAILED");
    lcd.setCursor(0, 1);
    lcd.print("Check Broker IP");
    Serial.println("[LCD] MQTT connection failed.");
  }

  delay(2000);
}

// ==========================================
// lcdClear()
// ==========================================
// Clears all characters from the LCD.
// Useful before displaying a new screen
// or when powering down the display.
// ==========================================
void lcdClear() {
  lcd.clear();
  Serial.println("[LCD] Screen cleared.");
}