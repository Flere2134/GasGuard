// ==========================================
// composables/useOverride.js
// ==========================================
// Vue composable that handles sending manual
// override commands from the dashboard to
// the backend API, which then publishes them
// to the ESP32 via MQTT.
//
// Used in OverridePanel.vue:
//   const { sendFanOverride, sendValveOverride,
//           isLoading, error, lastResult }
//         = useOverride()
// ==========================================

import { ref }    from "vue"
import axios      from "axios"
import { useAuthStore } from "@/stores/authStore"

// ==========================================
// API Base URL
// ==========================================
// In development: Vite proxy forwards /api
// requests to http://localhost:3000
//
// In production: set VITE_API_BASE_URL in
// frontend/.env to your deployed backend URL
// ==========================================
const API_BASE = import.meta.env.VITE_API_BASE_URL || ""

export function useOverride() {

  // ==========================================
  // Local State
  // ==========================================
  const isLoading  = ref(false)   // True while API call is in flight
  const error      = ref(null)    // Error message from last failed call
  const lastResult = ref(null)    // Result message from last successful call
  const history    = ref([])      // Local override history for this session

  const authStore  = useAuthStore()

  // ==========================================
  // getAuthHeaders()
  // ==========================================
  // Builds the Authorization header using the
  // current user's Firebase ID token.
  //
  // The token is fetched fresh each call to
  // ensure it hasn't expired (tokens last 1hr).
  // Firebase automatically refreshes them.
  // ==========================================
  async function getAuthHeaders() {
    const { auth } = await import("@/firebase")
    const token    = await auth.currentUser?.getIdToken()

    if (!token) {
      throw new Error("Not authenticated — please log in again.")
    }

    return {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }

  // ==========================================
  // sendCommand()
  // ==========================================
  // Core function that sends a POST request
  // to the backend /api/overrides endpoint.
  //
  // Parameters:
  //   device — "fan" or "valve"
  //   state  — "ON"/"OFF" or "OPEN"/"CLOSE"
  //
  // Returns { success, message }
  // ==========================================
  async function sendCommand(device, state) {
    isLoading.value  = true
    error.value      = null
    lastResult.value = null

    try {
      const headers  = await getAuthHeaders()

      const response = await axios.post(
        `${API_BASE}/api/overrides`,
        { device, state },
        { headers }
      )

      const message    = response.data.message
      lastResult.value = message

      // Add to local session history
      history.value.unshift({
        device,
        state,
        message,
        time:    new Date().toISOString(),
        success: true,
      })

      // Keep only last 10 in local history
      if (history.value.length > 10) {
        history.value = history.value.slice(0, 10)
      }

      console.log(`[useOverride] Command sent — ${device}: ${state}`)
      return { success: true, message }

    } catch (err) {
      const message = err.response?.data?.error
        || err.message
        || "Failed to send command."

      error.value = message

      // Log failed attempt to history
      history.value.unshift({
        device,
        state,
        message,
        time:    new Date().toISOString(),
        success: false,
      })

      console.error(`[useOverride] Command failed — ${device}: ${state} | ${message}`)
      return { success: false, message }

    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // sendFanOverride()
  // ==========================================
  // Turns the exhaust fan ON or OFF remotely.
  //
  // Parameters:
  //   turnOn — true to turn ON, false for OFF
  //
  // Example:
  //   await sendFanOverride(true)   → fan ON
  //   await sendFanOverride(false)  → fan OFF
  // ==========================================
  async function sendFanOverride(turnOn) {
    const state = turnOn ? "ON" : "OFF"
    return await sendCommand("fan", state)
  }

  // ==========================================
  // sendValveOverride()
  // ==========================================
  // Opens or closes the gas valve remotely.
  //
  // Parameters:
  //   open — true to OPEN, false to CLOSE
  //
  // Example:
  //   await sendValveOverride(true)   → valve OPEN
  //   await sendValveOverride(false)  → valve CLOSE
  //
  // NOTE: Closing the valve remotely cuts the
  // gas supply. Warn the user before doing this
  // in the OverridePanel component.
  // ==========================================
  async function sendValveOverride(open) {
    const state = open ? "OPEN" : "CLOSE"
    return await sendCommand("valve", state)
  }

  // ==========================================
  // clearError()
  // ==========================================
  // Clears the error message.
  // Called when the user dismisses an error
  // notification in OverridePanel.vue.
  // ==========================================
  function clearError() {
    error.value = null
  }

  return {
    isLoading,
    error,
    lastResult,
    history,
    sendFanOverride,
    sendValveOverride,
    clearError,
  }
}