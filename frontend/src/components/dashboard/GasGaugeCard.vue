<!-- ==========================================
  components/dashboard/GasGaugeCard.vue
  ==========================================
  Displays the current LPG gas concentration
  as a visual gauge with a progress bar,
  PPM value, threshold markers, and
  valve/fan status indicators.
========================================== -->

<template>
  <BaseCard title="Gas Concentration (LPG)">
    <template #icon>
      <vue-feather type="droplet" size="14" />
    </template>

    <!-- Main PPM Display -->
    <div class="ppm-display">
      <div class="ppm-value" :style="{ color: statusColors.text }">
        {{ ppmFormatted }}
      </div>
      <div class="ppm-unit">PPM</div>
    </div>

    <!-- Progress Bar -->
    <div class="bar-track" role="progressbar"
      :aria-valuenow="ppm"
      :aria-valuemin="0"
      :aria-valuemax="1000"
    >
      <!-- Warning zone marker -->
      <div class="bar-marker bar-marker-warning"
        :style="{ left: warningMarkerPercent + '%' }"
      ></div>

      <!-- Danger zone marker -->
      <div class="bar-marker bar-marker-danger"
        :style="{ left: dangerMarkerPercent + '%' }"
      ></div>

      <!-- Fill bar -->
      <div
        class="bar-fill"
        :style="{
          width: ppmBarPercent + '%',
          background: statusColors.bar,
          transition: 'width 0.6s ease, background 0.3s ease',
        }"
      ></div>
    </div>

    <!-- Threshold Labels -->
    <div class="bar-labels">
      <span class="label-left">0</span>
      <span class="label-warn">⚠ {{ THRESHOLD_WARNING }}</span>
      <span class="label-danger">🚨 {{ THRESHOLD_CRITICAL }}</span>
      <span class="label-right">{{ THRESHOLD_MAX }}</span>
    </div>

    <div class="divider"></div>

    <!-- Device State Row -->
    <div class="device-states">

      <!-- Valve State -->
      <div class="state-item">
        <vue-feather type="settings" size="18" />
        <div class="state-info">
          <span class="state-label">Valve</span>
          <span
            class="state-value"
            :class="sensorStore.isValveClosed ? 'state-closed' : 'state-open'"
          >
            {{ sensorStore.isValveClosed ? "Closed" : "Open" }}
          </span>
        </div>
      </div>

      <!-- Divider -->
      <div class="state-divider"></div>

      <!-- Fan State -->
      <div class="state-item">
        <vue-feather type="wind" size="18" />
        <div class="state-info">
          <span class="state-label">Exhaust Fan</span>
          <span
            class="state-value"
            :class="sensorStore.isFanRunning ? 'state-on' : 'state-off'"
          >
            {{ sensorStore.isFanRunning ? "Running" : "Off" }}
          </span>
        </div>
      </div>

      <!-- Divider -->
      <div class="state-divider"></div>

      <!-- Uptime -->
      <div class="state-item">
        <vue-feather type="clock" size="18" />
        <div class="state-info">
          <span class="state-label">Uptime</span>
          <span class="state-value state-neutral">
            {{ sensorStore.uptimeFormatted }}
          </span>
        </div>
      </div>

    </div>

    <!-- Footer — last updated -->
    <template #footer>
      <div class="footer-row">
        <span class="footer-text">
          {{ sensorStore.isConnected ? "Live" : "Offline" }}
        </span>
        <span class="footer-time">
          Last update: {{ lastUpdatedDisplay }}
        </span>
      </div>
    </template>

  </BaseCard>
</template>

<script setup>
import { computed }       from "vue"
import BaseCard           from "@/components/common/BaseCard.vue"
import { useSensorStore } from "@/stores/sensorStore"
import {
  THRESHOLD_WARNING,
  THRESHOLD_CRITICAL,
  THRESHOLD_MAX,
  formatTimestamp,
}                         from "@/utils/thresholds"

const sensorStore = useSensorStore()

// ==========================================
// Computed
// ==========================================
const ppm            = computed(() => sensorStore.ppm)
const ppmFormatted   = computed(() => sensorStore.ppmFormatted)
const ppmBarPercent  = computed(() => sensorStore.ppmBarPercent)
const statusColors   = computed(() => sensorStore.statusColors)

// Marker positions on the progress bar
const warningMarkerPercent = computed(() =>
  (THRESHOLD_WARNING / THRESHOLD_MAX) * 100
)
const dangerMarkerPercent = computed(() =>
  (THRESHOLD_CRITICAL / THRESHOLD_MAX) * 100
)

const lastUpdatedDisplay = computed(() =>
  formatTimestamp(sensorStore.lastUpdated)
)
</script>

<style scoped>
/* PPM Display */
.ppm-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 14px;
}
.ppm-value {
  font-size: 48px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition: color 0.3s ease;
}
.ppm-unit {
  font-size: 16px;
  color: #888780;
  font-weight: 400;
}

/* Progress Bar */
.bar-track {
  position: relative;
  height: 10px;
  background: #F1EFE8;
  border-radius: 5px;
  overflow: visible;
  margin-bottom: 6px;
}
.bar-fill {
  height: 100%;
  border-radius: 5px;
  min-width: 4px;
}
.bar-marker {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 18px;
  border-radius: 1px;
  z-index: 1;
}
.bar-marker-warning { background: #BA7517; }
.bar-marker-danger  { background: #E24B4A; }

/* Threshold Labels */
.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #888780;
  margin-bottom: 14px;
}
.label-warn   { color: #BA7517; font-weight: 500; }
.label-danger { color: #E24B4A; font-weight: 500; }

/* Divider */
.divider {
  height: 0.5px;
  background: #e0e0d8;
  margin-bottom: 14px;
}

/* Device States */
.device-states {
  display: flex;
  align-items: center;
  gap: 0;
}
.state-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.state-divider {
  width: 0.5px;
  height: 36px;
  background: #e0e0d8;
  margin: 0 12px;
}
.state-icon  { font-size: 18px; }
.state-info  { display: flex; flex-direction: column; gap: 1px; }
.state-label { font-size: 11px; color: #888780; }
.state-value { font-size: 13px; font-weight: 500; }

.state-open    { color: #3B6D11; }
.state-closed  { color: #A32D2D; }
.state-on      { color: #3B6D11; }
.state-off     { color: #888780; }
.state-neutral { color: #2C2C2A; }

/* Footer */
.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #888780;
}
.footer-text { font-weight: 500; color: #639922; }
</style>