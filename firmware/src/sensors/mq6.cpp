#include "mq6.h"

// ==========================================
// Internal Variables
// ==========================================

// Ro is the sensor resistance in clean air.
// This is used as the baseline for PPM calculation.
// Initial value is taken from config.h (MQ6_RO_CLEAN_AIR)
// but can be updated via calibrateMQ6()
static float Ro = MQ6_RO_CLEAN_AIR;

// Number of samples to average per reading
// to reduce noise from the ADC
static const int SAMPLE_COUNT = 10;

// Delay between each sample in milliseconds
static const int SAMPLE_DELAY_MS = 5;

// ==========================================
// MQ-6 LPG Curve Constants
// ==========================================
// These constants are derived from the MQ-6
// datasheet sensitivity curve for LPG gas.
//
// The curve follows a power law:
//   PPM = A * (Rs/Ro) ^ B
//
// Where:
//   A = 1000  (curve intercept)
//   B = -2.95 (curve slope — negative because
//              Rs/Ro decreases as PPM increases)
//
// These are approximate values. For higher
// accuracy, plot your own curve from the
// datasheet graph and recalculate A and B.
// ==========================================
static const float CURVE_A = 1000.0;
static const float CURVE_B = -2.95;

// ==========================================
// initMQ6()
// ==========================================
// Sets the MQ-6 analog pin as input and
// performs a warm-up delay reminder via Serial.
// ==========================================
void initMQ6() {
  pinMode(PIN_MQ6_ANALOG, INPUT);

  Serial.println("[MQ-6] Sensor initialized.");
  Serial.println("[MQ-6] WARNING: Allow 3 min warm-up for stable readings.");
  Serial.printf("[MQ-6] Using Ro = %.2f kΩ (from config)\n", Ro);
  Serial.printf("[MQ-6] WARNING threshold : %d PPM\n", GAS_THRESHOLD_WARNING);
  Serial.printf("[MQ-6] CRITICAL threshold: %d PPM\n", GAS_THRESHOLD_CRITICAL);
}

// ==========================================
// readMQ6Raw()
// ==========================================
// Reads multiple ADC samples and returns
// the averaged value to reduce noise.
// ESP32 ADC is 12-bit: range is 0 to 4095.
// ==========================================
int readMQ6Raw() {
  long total = 0;

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    total += analogRead(PIN_MQ6_ANALOG);
    delay(SAMPLE_DELAY_MS);
  }

  return (int)(total / SAMPLE_COUNT);
}

// ==========================================
// calculateRs()
// ==========================================
// Converts the raw ADC reading to the sensor
// resistance Rs using the voltage divider formula:
//
//   Vout = (ADC / ADC_MAX) * VCC
//   Rs   = RL * (VCC - Vout) / Vout
//
// Where RL is the load resistance (MQ6_RL_VALUE)
// ==========================================
float calculateRs(int rawADC) {
  if (rawADC == 0) rawADC = 1; // Prevent division by zero

  float vOut = ((float)rawADC / MQ6_ADC_MAX) * MQ6_VCC;
  float rs   = ((MQ6_VCC - vOut) / vOut) * MQ6_RL_VALUE;

  return rs;
}

// ==========================================
// calculatePPM()
// ==========================================
// Converts the Rs/Ro ratio to a PPM value
// using the MQ-6 LPG power curve:
//
//   PPM = A * (Rs / Ro) ^ B
//
// A higher Rs/Ro ratio means less gas detected.
// A lower Rs/Ro ratio means more gas detected.
// ==========================================
float calculatePPM(float rs) {
  if (Ro <= 0) return -1; // Guard against invalid Ro

  float ratio = rs / Ro;
  float ppm   = CURVE_A * pow(ratio, CURVE_B);

  return ppm;
}

// ==========================================
// readMQ6PPM()
// ==========================================
// Main function called from the loop.
// Chains raw read → Rs calculation → PPM
// and returns the final PPM float value.
// Also prints debug info to Serial Monitor.
// ==========================================
float readMQ6PPM() {
  int   rawADC = readMQ6Raw();
  float rs     = calculateRs(rawADC);
  float ppm    = calculatePPM(rs);

  // Clamp negative PPM values to 0
  // (can occur if sensor is not yet warmed up)
  if (ppm < 0) ppm = 0;

  Serial.printf("[MQ-6] Raw ADC: %d | Rs: %.2f kΩ | Rs/Ro: %.2f | PPM: %.2f\n",
    rawADC, rs, rs / Ro, ppm);

  return ppm;
}

// ==========================================
// calibrateMQ6()
// ==========================================
// Calculates Ro by averaging multiple Rs
// readings taken in clean air.
//
// HOW TO USE:
//   1. Ensure the environment has no LPG gas
//   2. Let the sensor warm up for at least
//      3 minutes after powering on
//   3. Call calibrateMQ6() once in setup()
//      and note the printed Ro value
//   4. Update MQ6_RO_CLEAN_AIR in config.h
//      with the printed value for future use
//
// Returns the calculated Ro value.
// ==========================================
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

  Ro = totalRs / samples;

  Serial.printf("[MQ-6] Calibration complete. Ro = %.2f kΩ\n", Ro);
  Serial.println("[MQ-6] Update MQ6_RO_CLEAN_AIR in config.h with this value.");

  return Ro;
}