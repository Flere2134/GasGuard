<!-- ==========================================
  views/DashboardView.vue
  ==========================================
  Main dashboard page of GasGuard.
  Assembles all dashboard components into
  the smart home monitoring layout.

  Layout (desktop):
    ┌─────────────────────────────────────┐
    │              AppNavbar              │
    ├──────────────┬──────────────────────┤
    │ StatusBadge  │    GasGaugeCard      │
    │              │                      │
    ├──────────────┴──────────────────────┤
    │         GasLineChart                │
    ├──────────────────┬──────────────────┤
    │   EnvReadings    │    AlertLog      │
    ├──────────────────┴──────────────────┤
    │           OverridePanel             │
    └─────────────────────────────────────┘
========================================== -->

<template>
  <div class="dashboard-page">

    <!-- Navbar -->
    <AppNavbar />

    <!-- Full screen loading while first data arrives -->
    <LoadingSpinner
      v-if="sensorStore.isLoading"
      size="lg"
      message="Connecting to GasGuard device..."
      full
    />

    <!-- Dashboard Content -->
    <main v-else class="dashboard-main">

      <!-- Offline Banner -->
      <transition name="slide-down">
        <div v-if="!realtime.isOnline.value" class="offline-banner">
          <span>📡</span>
          <span>Device offline — showing last known data. Check ESP32 connection.</span>
        </div>
      </transition>

      <!-- Grid Layout -->
      <div class="dashboard-grid">

        <!-- Row 1: Status + Gas Gauge -->
        <div class="row row-top">

          <!-- Status Badge -->
          <div class="col col-status">
            <StatusBadge />
          </div>

          <!-- Gas Gauge Card -->
          <div class="col col-gauge">
            <GasGaugeCard />
          </div>

        </div>

        <!-- Row 2: Line Chart (full width) -->
        <div class="row row-chart">
          <GasLineChart />
        </div>

        <!-- Row 3: Environment + Alert Log -->
        <div class="row row-mid">

          <div class="col col-half">
            <EnvReadings />
          </div>

          <div class="col col-half">
            <AlertLog />
          </div>

        </div>

        <!-- Row 4: Override Panel (full width) -->
        <div class="row row-override">
          <OverridePanel />
        </div>

      </div>

    </main>

    <!-- Connection error toast -->
    <transition name="fade">
      <div
        v-if="realtime.connectionError.value"
        class="error-toast"
      >
        ⚠️ {{ realtime.connectionError.value }}
      </div>
    </transition>

  </div>
</template>

<script setup>
import AppNavbar      from "@/components/layout/AppNavbar.vue"
import LoadingSpinner from "@/components/common/LoadingSpinner.vue"
import StatusBadge    from "@/components/dashboard/StatusBadge.vue"
import GasGaugeCard   from "@/components/dashboard/GasGaugeCard.vue"
import GasLineChart   from "@/components/dashboard/GasLineChart.vue"
import EnvReadings    from "@/components/dashboard/EnvReadings.vue"
import AlertLog       from "@/components/dashboard/AlertLog.vue"
import OverridePanel  from "@/components/dashboard/OverridePanel.vue"
import { useSensorStore } from "@/stores/sensorStore"
import { useRealtime }    from "@/composables/useRealtime"

const sensorStore = useSensorStore()

// useRealtime auto-starts on mount and
// auto-stops on unmount via lifecycle hooks
const realtime = useRealtime()
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #F1EFE8;
  display: flex;
  flex-direction: column;
}

/* Main Content */
.dashboard-main {
  flex: 1;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Offline Banner */
.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #FAEEDA;
  border: 0.5px solid #BA7517;
  border-radius: 8px;
  font-size: 13px;
  color: #854F0B;
  margin-bottom: 14px;
}

/* Grid Layout */
.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Rows */
.row { display: flex; gap: 12px; }

.row-top {
  align-items: stretch;
}
.row-chart  { flex-direction: column; }
.row-mid    { align-items: stretch; }
.row-override { flex-direction: column; }

/* Columns */
.col { display: flex; flex-direction: column; }

.col-status {
  width: 220px;
  flex-shrink: 0;
}
.col-gauge { flex: 1; }
.col-half  { flex: 1; }

/* Error Toast */
.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #FCEBEB;
  border: 0.5px solid #E24B4A;
  color: #A32D2D;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  z-index: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from,
.slide-down-leave-to     { opacity: 0; transform: translateY(-10px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .dashboard-main { padding: 12px; }
  .row-top  { flex-direction: column; }
  .row-mid  { flex-direction: column; }
  .col-status { width: 100%; }
}
</style>