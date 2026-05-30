#include "mq6.h"
#include <math.h>

static float Ro = MQ6_RO_CLEAN_AIR;
static const int SAMPLE_COUNT = 10;
static const int SAMPLE_DELAY_MS = 5;

static const float CURVE_A = 1000.0;
static const float CURVE_B = -2.95;

void initMQ6() {
  pinMode(PIN_MQ6_ANALOG, INPUT);
  Serial.println("[MQ-6] Sensor initialized.");
  Serial.println("[MQ-6] WARNING: Allow 3 min warm-up for stable readings.");
  Serial.printf("[MQ-6] Using Ro = %.2f kΩ (from config)\n", Ro);
}

int readMQ6Raw() {
  long total = 0;
  for (int i = 0; i < SAMPLE_COUNT; i++) {
    total += analogRead(PIN_MQ6_ANALOG);
    delay(SAMPLE_DELAY_MS);
  }
  return (int)(total / SAMPLE_COUNT);
}

float calculateRs(int rawADC) {
  if (rawADC == 0) rawADC = 1; 

  // 1. Calculate voltage at the ESP32 pin (0 to 3.3V)
  float vPin = ((float)rawADC / MQ6_ADC_MAX) * MQ6_VCC;
  
  // 2. Reverse the 10k/10k voltage divider to find the true sensor output voltage
  float vSensor = vPin * ((10.0 + 10.0) / 10.0);
  
  // 3. Calculate Rs using the 5.0V rail (MQ6_VCC_SENSOR from config.h)
  float rs = ((MQ6_VCC_SENSOR - vSensor) / vSensor) * MQ6_RL_VALUE;

  return rs;
}

float calculatePPM(float rs) {
  if (Ro <= 0) return -1; 

  float ratio = rs / Ro;
  float ppm   = CURVE_A * pow(ratio, CURVE_B);

  return ppm;
}

float readMQ6PPM() {
  int   rawADC = readMQ6Raw();
  float rs     = calculateRs(rawADC);
  
  // Floor the calculated data result before passing it to the main loop
  float ppm    = floor(calculatePPM(rs));

  if (ppm < 0) ppm = 0;

  Serial.printf("[MQ-6] Raw ADC: %d | Rs: %.2f kΩ | Rs/Ro: %.2f | PPM: %.0f\n",
    rawADC, rs, rs / Ro, ppm);

  return ppm;
}

float calibrateMQ6() {
  Serial.println("[MQ-6] Starting calibration in clean air...");
  Serial.println("[MQ-6] Taking 50 samples — please wait...");

  long totalRs = 0;
  int  samples = 50;

  for (int i = 0; i < samples; i++) {
    int   raw = readMQ6Raw();
    float rs  = calculateRs(raw);
    totalRs  += rs;
    delay(100);
  }

  // Calculate average resistance in clean air
  float cleanAirRs = totalRs / samples;
  
  // Divide by 10.0 to find true Ro
  Ro = cleanAirRs / 10.0; 

  Serial.printf("[MQ-6] Calibration complete. Ro = %.2f kΩ\n", Ro);
  Serial.println("[MQ-6] Update MQ6_RO_CLEAN_AIR in config.h with this value.");

  return Ro;
}