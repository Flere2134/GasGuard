// ==========================================
// stores/sensorStore.js
// ==========================================
// Pinia store that manages real-time sensor
// data from the GasGuard ESP32 device.
//
// Responsibilities:
//   - Hold latest telemetry snapshot
//   - Maintain PPM history for line chart
//   - Track device connection status
//   - Expose computed status and colors
// ==========================================

import { defineStore }        from "pinia"
import { ref, computed }      from "vue"
import {
  getPPMStatus,
  getStatusColors,
  getPPMBarPercent,
  formatUptime,
  formatPPM,
  STATUS_SAFE,
}                             from "@/utils/thresholds"

// Max number of PPM readings kept in history
// for the line chart — last 20 readings
const MAX_HISTORY = 20

export const useSensorStore = defineStore("sensor", () => {

  // ==========================================
  // State
  // ==========================================
  const telemetry     = ref(null)      // Latest full telemetry object from Firestore
  const ppmHistory    = ref([])        // Array of { time, ppm } for line chart
  const isConnected   = ref(false)     // True if ESP32 is sending data
  const lastUpdated   = ref(null)      // ISO timestamp of last received data
  const isLoading     = ref(true)      // True while waiting for first data

  // ==========================================
  // Getters — Sensor Values
  // ==========================================
  const ppm      = computed(() => telemetry.value?.ppm      ?? null)
  const temp     = computed(() => telemetry.value?.temp     ?? null)
  const humidity = computed(() => telemetry.value?.humidity ?? null)
  const uptime   = computed(() => telemetry.value?.uptime   ?? 0)
  const valve    = computed(() => telemetry.value?.valve    ?? "UNKNOWN")
  const fan      = computed(() => telemetry.value?.fan      ?? "UNKNOWN")
  const deviceIP = computed(() => telemetry.value?.ip       ?? "—")
  const device   = computed(() => telemetry.value?.device   ?? "GasGuard")

  // ==========================================
  // Getters — Derived Status
  // ==========================================
  const status = computed(() => {
    if (!telemetry.value) return STATUS_SAFE
    return getPPMStatus(ppm.value)
  })

  const statusColors = computed(() => getStatusColors(status.value))

  const ppmBarPercent = computed(() => getPPMBarPercent(ppm.value))

  const ppmFormatted = computed(() => formatPPM(ppm.value))

  const uptimeFormatted = computed(() => formatUptime(uptime.value))

  const isValveClosed = computed(() => valve.value === "CLOSED")

  const isFanRunning  = computed(() => fan.value === "ON")

  const isSafe    = computed(() => status.value === "SAFE")
  const isWarning = computed(() => status.value === "WARNING")
  const isDanger  = computed(() => status.value === "DANGER")

  // ==========================================
  // updateTelemetry()
  // ==========================================
  // Called by composables/useRealtime.js
  // whenever Firestore pushes a new snapshot.
  //
  // Updates the telemetry state and appends
  // the new PPM reading to the chart history.
  // ==========================================
  function updateTelemetry(data) {
    if (!data) return

    telemetry.value   = data
    isConnected.value = true
    isLoading.value   = false
    lastUpdated.value = data.serverTimestamp || new Date().toISOString()

    // Append to PPM history for line chart
    const now = new Date()
    const timeLabel = now.toLocaleTimeString("en-PH", {
      hour:   "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    ppmHistory.value.push({
      time: timeLabel,
      ppm:  Math.round(data.ppm ?? 0),
    })

    // Keep only the last MAX_HISTORY readings
    if (ppmHistory.value.length > MAX_HISTORY) {
      ppmHistory.value.shift()
    }
  }

  // ==========================================
  // setDisconnected()
  // ==========================================
  // Called when the Firestore listener
  // detects the connection has dropped or
  // no data has been received recently.
  // ==========================================
  function setDisconnected() {
    isConnected.value = false
    console.warn("[SensorStore] Device connection lost.")
  }

  // ==========================================
  // clearHistory()
  // ==========================================
  // Resets the PPM history array.
  // Called when the user logs out to avoid
  // stale chart data showing on next login.
  // ==========================================
  function clearHistory() {
    ppmHistory.value  = []
    telemetry.value   = null
    isConnected.value = false
    isLoading.value   = true
    lastUpdated.value = null
  }

  return {
    // State
    telemetry,
    ppmHistory,
    isConnected,
    lastUpdated,
    isLoading,
    // Sensor values
    ppm,
    temp,
    humidity,
    uptime,
    valve,
    fan,
    deviceIP,
    device,
    // Derived
    status,
    statusColors,
    ppmBarPercent,
    ppmFormatted,
    uptimeFormatted,
    isValveClosed,
    isFanRunning,
    isSafe,
    isWarning,
    isDanger,
    // Actions
    updateTelemetry,
    setDisconnected,
    clearHistory,
  }
})