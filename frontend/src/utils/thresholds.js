// ==========================================
// utils/thresholds.js
// ==========================================
// Centralized PPM threshold constants and
// helper functions for the GasGuard
// Vue 3 frontend.
//
// These values must match the thresholds
// defined in the ESP32 firmware config.h:
//   GAS_THRESHOLD_WARNING  = 200 PPM
//   GAS_THRESHOLD_CRITICAL = 500 PPM
//
// Used by:
//   - GasGaugeCard.vue   (bar color + fill)
//   - GasLineChart.vue   (threshold lines)
//   - StatusBadge.vue    (label + color)
//   - sensorStore.js     (state evaluation)
// ==========================================

// ==========================================
// PPM Threshold Values
// ==========================================
export const THRESHOLD_WARNING  = 200   // PPM — yellow alert
export const THRESHOLD_CRITICAL = 500   // PPM — red alert
export const THRESHOLD_MAX      = 1000  // PPM — gauge max display value

// ==========================================
// Alert Status Constants
// ==========================================
export const STATUS_SAFE    = "SAFE"
export const STATUS_WARNING = "WARNING"
export const STATUS_DANGER  = "DANGER"

// ==========================================
// Status Color Map
// ==========================================
// Maps each alert status to its matching
// CSS color values used across components.
//
// Colors match the gray/green theme:
//   SAFE    → green  (#639922 / #EAF3DE)
//   WARNING → amber  (#BA7517 / #FAEEDA)
//   DANGER  → red    (#A32D2D / #FCEBEB)
// ==========================================
export const STATUS_COLORS = {
  [STATUS_SAFE]: {
    text:       "#3B6D11",
    background: "#EAF3DE",
    border:     "#639922",
    bar:        "#639922",
    dot:        "#639922",
  },
  [STATUS_WARNING]: {
    text:       "#854F0B",
    background: "#FAEEDA",
    border:     "#BA7517",
    bar:        "#BA7517",
    dot:        "#BA7517",
  },
  [STATUS_DANGER]: {
    text:       "#A32D2D",
    background: "#FCEBEB",
    border:     "#E24B4A",
    bar:        "#E24B4A",
    dot:        "#E24B4A",
  },
}

// ==========================================
// getPPMStatus()
// ==========================================
// Evaluates a PPM value and returns the
// corresponding status string.
//
// Mirrors the alert_handler.cpp logic from
// the ESP32 firmware so the dashboard always
// shows the same status as the hardware.
//
// Parameters:
//   ppm — current gas concentration (float)
//
// Returns: "SAFE" | "WARNING" | "DANGER"
//
// Example:
//   getPPMStatus(45)   → "SAFE"
//   getPPMStatus(245)  → "WARNING"
//   getPPMStatus(650)  → "DANGER"
// ==========================================
export function getPPMStatus(ppm) {
  if (ppm === null || ppm === undefined || isNaN(ppm)) {
    return STATUS_SAFE
  }

  if (ppm >= THRESHOLD_CRITICAL) return STATUS_DANGER
  if (ppm >= THRESHOLD_WARNING)  return STATUS_WARNING
  return STATUS_SAFE
}

// ==========================================
// getStatusColors()
// ==========================================
// Returns the color object for a given
// status string.
//
// Parameters:
//   status — "SAFE" | "WARNING" | "DANGER"
//
// Returns: color object from STATUS_COLORS
//
// Example:
//   getStatusColors("DANGER").text → "#A32D2D"
//   getStatusColors("SAFE").bar   → "#639922"
// ==========================================
export function getStatusColors(status) {
  return STATUS_COLORS[status] || STATUS_COLORS[STATUS_SAFE]
}

// ==========================================
// getPPMBarPercent()
// ==========================================
// Converts a PPM value to a percentage
// for use in the gauge progress bar.
//
// Clamped between 0% and 100%.
// Based on THRESHOLD_MAX (1000 PPM).
//
// Example:
//   getPPMBarPercent(0)    → 0
//   getPPMBarPercent(200)  → 20
//   getPPMBarPercent(500)  → 50
//   getPPMBarPercent(1000) → 100
//   getPPMBarPercent(1200) → 100 (clamped)
// ==========================================
export function getPPMBarPercent(ppm) {
  if (!ppm || isNaN(ppm)) return 0
  const percent = (ppm / THRESHOLD_MAX) * 100
  return Math.min(Math.max(percent, 0), 100)
}

// ==========================================
// formatPPM()
// ==========================================
// Formats a PPM float value for display.
// Returns a zero-padded 4-digit string
// matching the LCD display format.
//
// Example:
//   formatPPM(45)   → "0045"
//   formatPPM(245)  → "0245"
//   formatPPM(1200) → "1200"
// ==========================================
export function formatPPM(ppm) {
  if (ppm === null || ppm === undefined || isNaN(ppm)) return "0000"
  return String(Math.round(ppm)).padStart(4, "0")
}

// ==========================================
// formatUptime()
// ==========================================
// Converts uptime in seconds to a human
// readable HH:MM:SS string for the
// device status card.
//
// Example:
//   formatUptime(3661) → "01:01:01"
//   formatUptime(90)   → "00:01:30"
// ==========================================
export function formatUptime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00:00"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":")
}

// ==========================================
// formatTimestamp()
// ==========================================
// Converts an ISO timestamp string to a
// short human-readable time string for
// the alert log and override history.
//
// Example:
//   formatTimestamp("2024-01-15T14:32:05.000Z")
//   → "14:32" (today)
//   → "Jan 15, 14:32" (older)
// ==========================================
export function formatTimestamp(isoString) {
  if (!isoString) return "—"

  const date  = new Date(isoString)
  const now   = new Date()
  const today = now.toDateString() === date.toDateString()

  const time = date.toLocaleTimeString("en-PH", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  if (today) return time

  const dateStr = date.toLocaleDateString("en-PH", {
    month: "short",
    day:   "numeric",
  })

  return `${dateStr}, ${time}`
}