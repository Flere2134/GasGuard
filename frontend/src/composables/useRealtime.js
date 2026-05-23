// ==========================================
// composables/useRealtime.js
// ==========================================
// Vue composable that manages the real-time
// Firestore connection for live sensor data.
//
// Responsibilities:
//   - Listen to gasguard_telemetry/latest
//   - Feed updates into sensorStore
//   - Start and stop alertStore listener
//   - Detect stale data (ESP32 offline)
//   - Clean up listeners on unmount
//
// Used in DashboardView.vue:
//   const { isOnline, lastSeen } = useRealtime()
// ==========================================

import { ref, onMounted, onUnmounted }  from "vue"
import { doc, onSnapshot }              from "firebase/firestore"
import { db, COLLECTIONS }             from "@/firebase"
import { useSensorStore }              from "@/stores/sensorStore"
import { useAlertStore }               from "@/stores/alertStore"

// If no new data arrives within this time,
// the device is considered offline (ms)
const STALE_TIMEOUT_MS = 10000 // 10 seconds

export function useRealtime() {

  // ==========================================
  // Local State
  // ==========================================
  const isOnline        = ref(false)   // True if ESP32 is actively sending
  const lastSeen        = ref(null)    // ISO timestamp of last received data
  const connectionError = ref(null)   // Firestore connection error message

  // Internal refs for cleanup
  let unsubscribeTelemetry = null
  let staleTimer           = null

  // Store instances
  const sensorStore = useSensorStore()
  const alertStore  = useAlertStore()

  // ==========================================
  // resetStaleTimer()
  // ==========================================
  // Resets the stale data detection timer.
  // Called every time fresh data arrives.
  // If no data arrives within STALE_TIMEOUT_MS,
  // the device is marked as offline.
  // ==========================================
  function resetStaleTimer() {
    if (staleTimer) clearTimeout(staleTimer)

    staleTimer = setTimeout(() => {
      isOnline.value = false
      sensorStore.setDisconnected()
      console.warn("[useRealtime] No data received — device may be offline.")
    }, STALE_TIMEOUT_MS)
  }

  // ==========================================
  // startTelemetryListener()
  // ==========================================
  // Attaches a real-time Firestore listener
  // to the gasguard_telemetry/latest document.
  //
  // Every time the backend writes a new
  // telemetry snapshot, this fires automatically
  // and pushes the data into sensorStore.
  // ==========================================
  function startTelemetryListener() {
    const telemetryRef = doc(db, COLLECTIONS.TELEMETRY, "latest")

    unsubscribeTelemetry = onSnapshot(
      telemetryRef,

      // ---- On data received ----
      (snapshot) => {
        if (!snapshot.exists()) {
          console.warn("[useRealtime] No telemetry document found yet.")
          sensorStore.isLoading = false
          return
        }

        const data = snapshot.data()

        // Update stores
        sensorStore.updateTelemetry(data)

        // Update local connection state
        isOnline.value = true
        lastSeen.value = data.serverTimestamp || new Date().toISOString()
        connectionError.value = null

        // Reset the stale data timer
        resetStaleTimer()

        console.log(`[useRealtime] Telemetry received — PPM: ${data.ppm} | Status: ${data.status}`)
      },

      // ---- On error ----
      (err) => {
        connectionError.value = "Failed to connect to database."
        isOnline.value        = false
        console.error("[useRealtime] Firestore error:", err.message)
      }
    )
  }

  // ==========================================
  // start()
  // ==========================================
  // Starts all real-time listeners.
  // Called in onMounted of DashboardView.
  // ==========================================
  function start() {
    console.log("[useRealtime] Starting listeners...")
    startTelemetryListener()
    alertStore.startListening()
  }

  // ==========================================
  // stop()
  // ==========================================
  // Detaches all listeners and clears timers.
  // Called in onUnmounted of DashboardView
  // to prevent memory leaks.
  // ==========================================
  function stop() {
    console.log("[useRealtime] Stopping listeners...")

    if (unsubscribeTelemetry) {
      unsubscribeTelemetry()
      unsubscribeTelemetry = null
    }

    if (staleTimer) {
      clearTimeout(staleTimer)
      staleTimer = null
    }

    alertStore.stopListening()
    isOnline.value = false
  }

  // ==========================================
  // Auto start/stop with component lifecycle
  // ==========================================
  onMounted(() => start())
  onUnmounted(() => stop())

  return {
    isOnline,
    lastSeen,
    connectionError,
    start,
    stop,
  }
}