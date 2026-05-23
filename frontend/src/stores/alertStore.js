// ==========================================
// stores/alertStore.js
// ==========================================
// Pinia store that manages the alert event
// log for the GasGuard Vue 3 dashboard.
//
// Responsibilities:
//   - Hold recent alerts from Firestore
//   - Fetch full alert history from backend
//   - Track unread alert count
//   - Provide filtered alert views
// ==========================================

import { defineStore }        from "pinia"
import { ref, computed }      from "vue"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
}                             from "firebase/firestore"
import { db, COLLECTIONS }    from "@/firebase"
import { formatTimestamp }    from "@/utils/thresholds"

export const useAlertStore = defineStore("alert", () => {

  // ==========================================
  // State
  // ==========================================
  const alerts        = ref([])       // Alert documents from Firestore
  const isLoading     = ref(false)    // True while fetching
  const error         = ref(null)     // Fetch error message
  const unreadCount   = ref(0)        // Unread alert badge count
  let   unsubscribe   = null          // Firestore listener unsubscribe fn

  // ==========================================
  // Getters
  // ==========================================
  const hasAlerts = computed(() => alerts.value.length > 0)

  const dangerAlerts = computed(() =>
    alerts.value.filter((a) => a.level === "DANGER")
  )

  const warningAlerts = computed(() =>
    alerts.value.filter((a) => a.level === "WARNING")
  )

  // Most recent alert
  const latestAlert = computed(() =>
    alerts.value.length > 0 ? alerts.value[0] : null
  )

  // Formatted alerts with readable timestamps
  const formattedAlerts = computed(() =>
    alerts.value.map((alert) => ({
      ...alert,
      timeDisplay: formatTimestamp(alert.serverTimestamp),
    }))
  )

  // ==========================================
  // startListening()
  // ==========================================
  // Starts a real-time Firestore listener
  // on the gasguard_alerts collection.
  //
  // Automatically updates the alerts array
  // whenever a new alert is added to Firestore
  // by the backend alertService.
  //
  // Limited to the last 20 alerts ordered
  // by timestamp descending (newest first).
  //
  // Called by useRealtime.js composable when
  // the dashboard mounts.
  // ==========================================
  function startListening() {
    if (unsubscribe) return // Already listening

    isLoading.value = true
    error.value     = null

    const alertsRef = collection(db, COLLECTIONS.ALERTS)
    const q = query(
      alertsRef,
      orderBy("serverTimestamp", "desc"),
      limit(20)
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const incoming = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Count new alerts since last check
        const previousCount = alerts.value.length
        const newCount       = incoming.length

        if (newCount > previousCount && previousCount > 0) {
          unreadCount.value += (newCount - previousCount)
        }

        alerts.value   = incoming
        isLoading.value = false

        console.log(`[AlertStore] ${incoming.length} alerts loaded.`)
      },
      (err) => {
        error.value     = "Failed to load alerts."
        isLoading.value = false
        console.error("[AlertStore] Firestore listener error:", err.message)
      }
    )
  }

  // ==========================================
  // stopListening()
  // ==========================================
  // Detaches the Firestore real-time listener.
  // Called when the dashboard unmounts or the
  // user logs out to prevent memory leaks and
  // unnecessary Firestore reads.
  // ==========================================
  function stopListening() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
      console.log("[AlertStore] Listener detached.")
    }
  }

  // ==========================================
  // markAllRead()
  // ==========================================
  // Resets the unread alert count to zero.
  // Called when the user opens the alert log.
  // ==========================================
  function markAllRead() {
    unreadCount.value = 0
  }

  // ==========================================
  // clearAlerts()
  // ==========================================
  // Resets all alert state.
  // Called on logout to prevent stale data
  // showing on the next login.
  // ==========================================
  function clearAlerts() {
    stopListening()
    alerts.value      = []
    unreadCount.value = 0
    error.value       = null
    isLoading.value   = false
  }

  return {
    // State
    alerts,
    isLoading,
    error,
    unreadCount,
    // Getters
    hasAlerts,
    dangerAlerts,
    warningAlerts,
    latestAlert,
    formattedAlerts,
    // Actions
    startListening,
    stopListening,
    markAllRead,
    clearAlerts,
  }
})