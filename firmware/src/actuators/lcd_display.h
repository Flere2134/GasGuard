#ifndef LCD_DISPLAY_H
#define LCD_DISPLAY_H

#include <Arduino.h>
#include "../config.h"

// ==========================================
// Function Declarations
// ==========================================

// Initializes the I2C LCD display
// Must be called once in setup()
void initLCD();

// Displays the boot screen on startup
// Shows project name and version
void lcdShowBoot();

// Displays a two line general message
// Line 1: title, Line 2: subtitle
void lcdShowMessage(const char* line1, const char* line2);

// Displays the real time sensor status screen
// Shows current alert status, PPM, temp, humidity
// This is the main screen shown during operation
void lcdShowStatus(const char* status, float ppm,
                   float temp, float humidity);

// Displays WiFi connection status
void lcdShowWiFiStatus(const char* ssid, bool connected);

// Displays MQTT connection status
void lcdShowMQTTStatus(bool connected);

// Clears the LCD screen
void lcdClear();

#endif // LCD_DISPLAY_H