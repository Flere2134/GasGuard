<!-- ==========================================
  components/dashboard/StatusBadge.vue
  ==========================================
  Displays the current system alert status
  as a large prominent badge on the dashboard.

  Shows:
    - Status label (SAFE / WARNING / DANGER)
    - PPM value
    - Animated pulse ring on WARNING/DANGER
    - Device offline state

  Props:
    showPPM — show PPM value below label (default: true)
========================================== -->

<template>
  <div class="status-wrapper">

    <!-- Pulse ring — only on WARNING and DANGER -->
    <div
      v-if="isDanger || isWarning"
      class="pulse-ring"
      :class="isDanger ? 'pulse-danger' : 'pulse-warning'"
    ></div>

    <!-- Main badge -->
    <div class="status-badge" :class="badgeClass">

      <!-- Icon -->
      <span class="status-icon" role="img" :aria-label="statusLabel">
        {{ statusIcon }}
      </span>

      <!-- Label -->
      <div class="status-label">{{ statusLabel }}</div>

      <!-- PPM value -->
      <div v-if="showPPM && ppm !== null" class="status-ppm">
        {{ ppmFormatted }} <span class="ppm-unit">PPM</span>
      </div>

      <!-- Offline message -->
      <div v-if="!isConnected" class="status-offline-msg">
        Device not connected
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed }       from "vue"
import { useSensorStore } from "@/stores/sensorStore"

defineProps({
  showPPM: { type: Boolean, default: true },
})

const sensorStore = useSensorStore()

// ==========================================
// Computed
// ==========================================
const isConnected  = computed(() => sensorStore.isConnected)
const ppm          = computed(() => sensorStore.ppm)
const ppmFormatted = computed(() => sensorStore.ppmFormatted)
const isWarning    = computed(() => sensorStore.isWarning)
const isDanger     = computed(() => sensorStore.isDanger)

const statusLabel = computed(() => {
  if (!isConnected.value) return "OFFLINE"
  return sensorStore.status
})

const statusIcon = computed(() => {
  if (!isConnected.value) return "📡"
  const icons = {
    SAFE:    "✅",
    WARNING: "⚠️",
    DANGER:  "🚨",
  }
  return icons[sensorStore.status] || "✅"
})

const badgeClass = computed(() => {
  if (!isConnected.value) return "badge-offline"
  const classes = {
    SAFE:    "badge-safe",
    WARNING: "badge-warning",
    DANGER:  "badge-danger",
  }
  return classes[sensorStore.status] || "badge-safe"
})
</script>

<style scoped>
.status-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

/* Pulse ring animation for WARNING and DANGER */
.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  animation: pulse 2s ease-out infinite;
  pointer-events: none;
}
.pulse-warning { background: rgba(186, 117, 23, 0.15); }
.pulse-danger  { background: rgba(226, 75, 74, 0.15); }

@keyframes pulse {
  0%   { opacity: 1;   transform: scale(1); }
  70%  { opacity: 0;   transform: scale(1.08); }
  100% { opacity: 0;   transform: scale(1.08); }
}

/* Main badge */
.status-badge {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 20px 32px;
  border-radius: 16px;
  width: 100%;
  transition: background 0.3s, border-color 0.3s;
}

/* Status variants */
.badge-safe {
  background: #EAF3DE;
  border: 1px solid #639922;
  color: #3B6D11;
}
.badge-warning {
  background: #FAEEDA;
  border: 1px solid #BA7517;
  color: #854F0B;
}
.badge-danger {
  background: #FCEBEB;
  border: 1px solid #E24B4A;
  color: #A32D2D;
}
.badge-offline {
  background: #F1EFE8;
  border: 1px solid #D3D1C7;
  color: #888780;
}

/* Inner elements */
.status-icon  { font-size: 28px; line-height: 1; }
.status-label {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.06em;
}
.status-ppm {
  font-size: 28px;
  font-weight: 500;
  margin-top: 4px;
}
.ppm-unit {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.7;
}
.status-offline-msg {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}
</style>