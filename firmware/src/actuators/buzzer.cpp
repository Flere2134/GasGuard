#include "buzzer.h"

// ==========================================
// Internal State
// ==========================================
static bool buzzerActive = false;

// ==========================================
// Tone Configuration
// ==========================================
// The ESP32 uses the ledcWrite() function
// to generate PWM tones on the buzzer pin.
// We use LEDC (LED Control) peripheral
// which can generate precise frequencies.
//
// Channel : 0  (ESP32 has 16 LEDC channels)
// Resolution: 8-bit (0–255 duty cycle)
// ==========================================
static const int LEDC_CHANNEL    = 0;
static const int LEDC_RESOLUTION = 8;
static const int DUTY_CYCLE      = 128;  // 50% duty — standard square wave tone

// Tone frequencies in Hz
static const int FREQ_WARNING = 1000;  // 1kHz — moderate warning tone
static const int FREQ_DANGER  = 2500;  // 2.5kHz — high pitched urgent alarm

// ==========================================
// initBuzzer()
// ==========================================
// Configures the LEDC PWM channel and
// attaches it to the buzzer pin.
// Plays a short startup beep to confirm
// the buzzer hardware is working correctly.
// ==========================================
void initBuzzer() {
  // Configure LEDC PWM channel
  ledcSetup(LEDC_CHANNEL, FREQ_WARNING, LEDC_RESOLUTION);

  // Attach the channel to the buzzer GPIO pin
  ledcAttachPin(PIN_BUZZER, LEDC_CHANNEL);

  // Ensure buzzer starts silent
  ledcWrite(LEDC_CHANNEL, 0);
  buzzerActive = false;

  Serial.println("[BUZZER] Initialized.");
  Serial.printf("[BUZZER] Pin: GPIO %d | LEDC Channel: %d\n",
    PIN_BUZZER, LEDC_CHANNEL);

  // Short startup confirmation beep
  Serial.println("[BUZZER] Running startup beep test...");
  buzzerBeep(200);
  Serial.println("[BUZZER] Startup beep complete.");
}

// ==========================================
// buzzerWarning()
// ==========================================
// Plays an intermittent two-beep pattern
// to signal a WARNING state.
//
// Pattern: BEEP(300ms) — PAUSE(200ms)
//          BEEP(300ms) — PAUSE(500ms)
//
// Uses non-blocking style by tracking time
// so it does not freeze the main loop.
// The pattern plays once per call — main.cpp
// calls this repeatedly every sensor cycle.
// ==========================================
void buzzerWarning() {
  buzzerActive = true;

  ledcSetup(LEDC_CHANNEL, FREQ_WARNING, LEDC_RESOLUTION);

  // Beep 1
  ledcWrite(LEDC_CHANNEL, DUTY_CYCLE);
  delay(300);
  ledcWrite(LEDC_CHANNEL, 0);
  delay(200);

  // Beep 2
  ledcWrite(LEDC_CHANNEL, DUTY_CYCLE);
  delay(300);
  ledcWrite(LEDC_CHANNEL, 0);
  delay(500);

  buzzerActive = false;
  Serial.println("[BUZZER] WARNING pattern played.");
}

// ==========================================
// buzzerDanger()
// ==========================================
// Plays a rapid repeating beep pattern
// to signal a DANGER / CRITICAL state.
//
// Pattern: 5x rapid beeps
//          BEEP(100ms) — PAUSE(100ms)
//
// High frequency (2.5kHz) makes this tone
// more urgent and attention grabbing than
// the WARNING tone.
// ==========================================
void buzzerDanger() {
  buzzerActive = true;

  ledcSetup(LEDC_CHANNEL, FREQ_DANGER, LEDC_RESOLUTION);

  for (int i = 0; i < 5; i++) {
    ledcWrite(LEDC_CHANNEL, DUTY_CYCLE);
    delay(100);
    ledcWrite(LEDC_CHANNEL, 0);
    delay(100);
  }

  buzzerActive = false;
  Serial.println("[BUZZER] DANGER pattern played.");
}

// ==========================================
// buzzerBeep()
// ==========================================
// Plays a single beep of a specified
// duration in milliseconds.
// Used for system confirmations such as:
//   - Boot ready
//   - Valve successfully closed
//   - MQTT connection established
// ==========================================
void buzzerBeep(int durationMs) {
  buzzerActive = true;

  ledcSetup(LEDC_CHANNEL, FREQ_WARNING, LEDC_RESOLUTION);
  ledcWrite(LEDC_CHANNEL, DUTY_CYCLE);
  delay(durationMs);
  ledcWrite(LEDC_CHANNEL, 0);

  buzzerActive = false;
}

// ==========================================
// stopBuzzer()
// ==========================================
// Immediately silences the buzzer by
// setting the PWM duty cycle to 0.
// Called when the system returns to SAFE
// state or when a remote override is issued.
// ==========================================
void stopBuzzer() {
  ledcWrite(LEDC_CHANNEL, 0);
  buzzerActive = false;
  Serial.println("[BUZZER] Stopped.");
}

// ==========================================
// isBuzzerActive()
// ==========================================
// Returns true if the buzzer is currently
// making sound. Can be used by other modules
// to check buzzer status without directly
// accessing the hardware pin.
// ==========================================
bool isBuzzerActive() {
  return buzzerActive;
}