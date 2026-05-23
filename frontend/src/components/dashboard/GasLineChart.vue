<!-- ==========================================
  components/dashboard/GasLineChart.vue
  ==========================================
  Displays a real-time line chart of the
  last 20 PPM readings using Chart.js.

  Features:
    - Live updating line chart
    - Warning and danger threshold lines
    - Color coded fill under the line
    - Smooth animation on data update
    - Empty state when no data yet
========================================== -->

<template>
  <BaseCard title="Gas Level History">
    <template #icon>
      <vue-feather type="trending-up" size="14" />
    </template>

    <!-- Empty state -->
    <div v-if="!hasData" class="empty-state">
      <vue-feather type="wifi-off" size="32" />
      <p class="empty-text">Waiting for sensor data...</p>
      <p class="empty-sub">Chart will appear once the ESP32 starts sending readings.</p>
    </div>

    <!-- Chart -->
    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Legend -->
    <div v-if="hasData" class="legend">
      <div class="legend-item">
        <span class="legend-dot" style="background:#639922"></span>
        <span>PPM Reading</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" style="background:#BA7517"></span>
        <span>Warning ({{ THRESHOLD_WARNING }})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line" style="background:#E24B4A"></span>
        <span>Danger ({{ THRESHOLD_CRITICAL }})</span>
      </div>
    </div>

  </BaseCard>
</template>

<script setup>
import { computed, watch }  from "vue"
import { Line }             from "vue-chartjs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
}                           from "chart.js"
import BaseCard             from "@/components/common/BaseCard.vue"
import { useSensorStore }   from "@/stores/sensorStore"
import {
  THRESHOLD_WARNING,
  THRESHOLD_CRITICAL,
  THRESHOLD_MAX,
}                           from "@/utils/thresholds"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const sensorStore = useSensorStore()

// ==========================================
// Computed
// ==========================================
const hasData = computed(() =>
  sensorStore.ppmHistory.length > 0
)

const labels = computed(() =>
  sensorStore.ppmHistory.map((r) => r.time)
)

const ppmValues = computed(() =>
  sensorStore.ppmHistory.map((r) => r.ppm)
)

// Determine line and fill color based on
// the highest PPM value in the current history
const currentColor = computed(() => {
  const max = Math.max(...ppmValues.value, 0)
  if (max >= THRESHOLD_CRITICAL) return "#E24B4A"
  if (max >= THRESHOLD_WARNING)  return "#BA7517"
  return "#639922"
})

const currentFill = computed(() => {
  const max = Math.max(...ppmValues.value, 0)
  if (max >= THRESHOLD_CRITICAL) return "rgba(226,75,74,0.12)"
  if (max >= THRESHOLD_WARNING)  return "rgba(186,117,23,0.12)"
  return "rgba(99,153,34,0.12)"
})

// ==========================================
// Chart Data
// ==========================================
const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    // PPM line
    {
      label:           "PPM",
      data:            ppmValues.value,
      borderColor:     currentColor.value,
      backgroundColor: currentFill.value,
      borderWidth:     2,
      pointRadius:     3,
      pointHoverRadius: 5,
      pointBackgroundColor: currentColor.value,
      fill:            true,
      tension:         0.3, // Smooth curve
    },
    // Warning threshold line
    {
      label:       `Warning (${THRESHOLD_WARNING})`,
      data:        labels.value.map(() => THRESHOLD_WARNING),
      borderColor: "#BA7517",
      borderWidth: 1,
      borderDash:  [5, 5],
      pointRadius: 0,
      fill:        false,
      tension:     0,
    },
    // Danger threshold line
    {
      label:       `Danger (${THRESHOLD_CRITICAL})`,
      data:        labels.value.map(() => THRESHOLD_CRITICAL),
      borderColor: "#E24B4A",
      borderWidth: 1,
      borderDash:  [5, 5],
      pointRadius: 0,
      fill:        false,
      tension:     0,
    },
  ],
}))

// ==========================================
// Chart Options
// ==========================================
const chartOptions = computed(() => ({
  responsive:          true,
  maintainAspectRatio: false,
  animation: {
    duration: 400, // Fast smooth update animation
  },
  interaction: {
    intersect: false,
    mode:      "index", // Show all datasets at hovered x
  },
  plugins: {
    legend: {
      display: false, // We use our custom legend below
    },
    tooltip: {
      backgroundColor: "#2C2C2A",
      titleColor:      "#F1EFE8",
      bodyColor:       "#D3D1C7",
      padding:         10,
      cornerRadius:    8,
      callbacks: {
        label: (ctx) => {
          if (ctx.dataset.label === "PPM") {
            return ` ${ctx.parsed.y} PPM`
          }
          return ` ${ctx.dataset.label}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color:   "rgba(0,0,0,0.04)",
        display: true,
      },
      ticks: {
        color:    "#888780",
        font:     { size: 10 },
        maxRotation: 0,
        // Show only every 5th label to avoid crowding
        callback: (val, idx) => idx % 5 === 0
          ? labels.value[idx]
          : "",
      },
    },
    y: {
      min: 0,
      max: THRESHOLD_MAX,
      grid: {
        color: "rgba(0,0,0,0.04)",
      },
      ticks: {
        color:     "#888780",
        font:      { size: 10 },
        stepSize:  200,
        callback:  (val) => `${val}`,
      },
    },
  },
}))
</script>

<style scoped>
.chart-container {
  height: 180px;
  position: relative;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 8px;
}
.empty-icon { font-size: 32px; }
.empty-text {
  font-size: 14px;
  font-weight: 500;
  color: #5F5E5A;
  margin: 0;
}
.empty-sub {
  font-size: 12px;
  color: #888780;
  text-align: center;
  margin: 0;
}

/* Legend */
.legend {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #5F5E5A;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-line {
  width: 14px;
  height: 2px;
  flex-shrink: 0;
  border-radius: 1px;
  border-top: 2px dashed;
  background: transparent !important;
}
</style>