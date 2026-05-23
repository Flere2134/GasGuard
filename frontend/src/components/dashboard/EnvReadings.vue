<!-- ==========================================
  components/dashboard/EnvReadings.vue
  ==========================================
  Displays the current temperature and
  humidity readings from the DHT22 sensor
  along with device connection info.
========================================== -->

<template>
  <BaseCard icon="🌡️" title="Environment">

    <!-- Temperature -->
    <div class="reading-row">
      <div class="reading-icon-wrap temp">
        <span class="reading-icon">🌡️</span>
      </div>
      <div class="reading-info">
        <span class="reading-label">Temperature</span>
        <div class="reading-value-row">
          <span
            class="reading-value"
            :class="tempStatusClass"
          >
            {{ tempDisplay }}
          </span>
          <span class="reading-unit">°C</span>
        </div>
        <span class="reading-sub">{{ tempNote }}</span>
      </div>
      <!-- Mini bar -->
      <div class="mini-bar-wrap">
        <div class="mini-bar-track">
          <div
            class="mini-bar-fill temp-fill"
            :style="{ height: tempBarPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="row-divider"></div>

    <!-- Humidity -->
    <div class="reading-row">
      <div class="reading-icon-wrap humid">
        <span class="reading-icon">💧</span>
      </div>
      <div class="reading-info">
        <span class="reading-label">Humidity</span>
        <div class="reading-value-row">
          <span
            class="reading-value"
            :class="humidStatusClass"
          >
            {{ humidDisplay }}
          </span>
          <span class="reading-unit">%</span>
        </div>
        <span class="reading-sub">{{ humidNote }}</span>
      </div>
      <!-- Mini bar -->
      <div class="mini-bar-wrap">
        <div class="mini-bar-track">
          <div
            class="mini-bar-fill humid-fill"
            :style="{ height: humidBarPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="row-divider"></div>

    <!-- Device Info Grid -->
    <div class="device-grid">

      <div class="device-item">
        <span class="device-item-label">Device</span>
        <span class="device-item-value">{{ sensorStore.device }}</span>
      </div>

      <div class="device-item">
        <span class="device-item-label">IP Address</span>
        <span class="device-item-value">{{ sensorStore.deviceIP }}</span>
      </div>

      <div class="device-item">
        <span class="device-item-label">Connection</span>
        <span
          class="device-item-value"
          :class="sensorStore.isConnected ? 'conn-online' : 'conn-offline'"
        >
          {{ sensorStore.isConnected ? "● Online" : "○ Offline" }}
        </span>
      </div>

      <div class="device-item">
        <span class="device-item-label">Uptime</span>
        <span class="device-item-value">{{ sensorStore.uptimeFormatted }}</span>
      </div>

    </div>

  </BaseCard>
</template>

<script setup>
import { computed }       from "vue"
import BaseCard           from "@/components/common/BaseCard.vue"
import { useSensorStore } from "@/stores/sensorStore"

const sensorStore = useSensorStore()

// ==========================================
// Temperature Computed
// ==========================================
const temp = computed(() => sensorStore.temp)

const tempDisplay = computed(() => {
  if (temp.value === null || temp.value === -999) return "--"
  return temp.value.toFixed(1)
})

// Color coding for temperature
// Normal indoor range: 18°C – 32°C
// High: above 35°C (may indicate fire risk)
const tempStatusClass = computed(() => {
  if (temp.value === null) return "value-neutral"
  if (temp.value >= 35)    return "value-danger"
  if (temp.value >= 32)    return "value-warning"
  return "value-normal"
})

const tempNote = computed(() => {
  if (temp.value === null) return "No reading"
  if (temp.value >= 35)    return "High temperature"
  if (temp.value >= 32)    return "Above normal"
  if (temp.value < 18)     return "Below normal"
  return "Normal range"
})

// Bar fills from 0°C (bottom) to 50°C (top)
const tempBarPercent = computed(() => {
  if (temp.value === null) return 0
  return Math.min(Math.max((temp.value / 50) * 100, 0), 100)
})

// ==========================================
// Humidity Computed
// ==========================================
const humidity = computed(() => sensorStore.humidity)

const humidDisplay = computed(() => {
  if (humidity.value === null || humidity.value === -999) return "--"
  return Math.round(humidity.value)
})

// Normal indoor humidity: 40% – 70%
const humidStatusClass = computed(() => {
  if (humidity.value === null) return "value-neutral"
  if (humidity.value > 80)     return "value-warning"
  if (humidity.value < 30)     return "value-warning"
  return "value-normal"
})

const humidNote = computed(() => {
  if (humidity.value === null) return "No reading"
  if (humidity.value > 80)     return "Very humid"
  if (humidity.value > 70)     return "Slightly high"
  if (humidity.value < 30)     return "Very dry"
  if (humidity.value < 40)     return "Slightly dry"
  return "Normal range"
})

const humidBarPercent = computed(() => {
  if (humidity.value === null) return 0
  return Math.min(Math.max(humidity.value, 0), 100)
})
</script>

<style scoped>
/* Reading Row */
.reading-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.reading-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.temp  { background: #FFF3E0; }
.humid { background: #E3F2FD; }
.reading-icon { font-size: 20px; }

.reading-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.reading-label {
  font-size: 12px;
  color: #888780;
}
.reading-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.reading-value {
  font-size: 26px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.reading-unit {
  font-size: 14px;
  color: #888780;
}
.reading-sub {
  font-size: 11px;
  color: #888780;
}

/* Value color states */
.value-normal  { color: #2C2C2A; }
.value-warning { color: #854F0B; }
.value-danger  { color: #A32D2D; }
.value-neutral { color: #888780; }

/* Mini vertical bar */
.mini-bar-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 10px;
  flex-shrink: 0;
}
.mini-bar-track {
  width: 6px;
  height: 48px;
  background: #F1EFE8;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.mini-bar-fill {
  width: 100%;
  border-radius: 3px;
  transition: height 0.6s ease;
}
.temp-fill  { background: #F97316; }
.humid-fill { background: #3B82F6; }

/* Divider */
.row-divider {
  height: 0.5px;
  background: #e0e0d8;
  margin: 12px 0;
}

/* Device Info Grid */
.device-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.device-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.device-item-label {
  font-size: 11px;
  color: #888780;
}
.device-item-value {
  font-size: 13px;
  font-weight: 500;
  color: #2C2C2A;
}
.conn-online  { color: #3B6D11; }
.conn-offline { color: #888780; }
</style>