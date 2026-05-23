<!-- ==========================================
  components/dashboard/AlertLog.vue
  ==========================================
  Displays a real-time log of gas alert
  events fetched from Firestore.

  Features:
    - Real-time updates via alertStore
    - Color coded rows by alert level
    - Filter by WARNING / DANGER / ALL
    - Empty state when no alerts exist
    - Unread count badge on filter tabs
========================================== -->

<template>
  <BaseCard icon="🔔" title="Alert Log">

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ 'tab-active': activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="tab-count"
          :class="tab.countClass"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="alertStore.isLoading" class="center-state">
      <LoadingSpinner size="sm" message="Loading alerts..." />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredAlerts.length === 0"
      class="center-state"
    >
      <span class="empty-icon">✅</span>
      <p class="empty-text">No {{ activeFilter === "ALL" ? "" : activeFilter.toLowerCase() }} alerts recorded.</p>
      <p class="empty-sub">The system has been running cleanly.</p>
    </div>

    <!-- Alert List -->
    <div v-else class="alert-list">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="alert-row"
        :class="alertRowClass(alert.level)"
      >
        <!-- Level dot -->
        <div
          class="alert-dot"
          :class="alertDotClass(alert.level)"
        ></div>

        <!-- Alert content -->
        <div class="alert-content">
          <div class="alert-main">
            <span class="alert-level" :class="alertLevelClass(alert.level)">
              {{ alert.level }}
            </span>
            <span class="alert-ppm">{{ alert.ppm?.toFixed(0) }} PPM</span>
          </div>
          <div class="alert-details">
            <span class="alert-detail">
              Valve: {{ alert.valve || "—" }}
            </span>
            <span class="alert-detail-sep">·</span>
            <span class="alert-detail">
              Fan: {{ alert.fan || "—" }}
            </span>
            <span class="alert-detail-sep">·</span>
            <span class="alert-detail">
              {{ alert.device || "GasGuard" }}
            </span>
          </div>
        </div>

        <!-- Timestamp -->
        <div class="alert-time">{{ alert.timeDisplay }}</div>

      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="footer-row">
        <span class="footer-count">
          {{ filteredAlerts.length }} event{{ filteredAlerts.length !== 1 ? "s" : "" }}
        </span>
        <span class="footer-source">
          Live from Firestore
        </span>
      </div>
    </template>

  </BaseCard>
</template>

<script setup>
import { ref, computed }    from "vue"
import BaseCard             from "@/components/common/BaseCard.vue"
import LoadingSpinner       from "@/components/common/LoadingSpinner.vue"
import { useAlertStore }    from "@/stores/alertStore"

const alertStore  = useAlertStore()
const activeFilter = ref("ALL")

// ==========================================
// Filter Tabs Config
// ==========================================
const tabs = computed(() => [
  {
    value:      "ALL",
    label:      "All",
    count:      alertStore.alerts.length,
    countClass: "count-neutral",
  },
  {
    value:      "DANGER",
    label:      "Danger",
    count:      alertStore.dangerAlerts.length,
    countClass: "count-danger",
  },
  {
    value:      "WARNING",
    label:      "Warning",
    count:      alertStore.warningAlerts.length,
    countClass: "count-warning",
  },
])

// ==========================================
// Filtered Alerts
// ==========================================
const filteredAlerts = computed(() => {
  const formatted = alertStore.formattedAlerts
  if (activeFilter.value === "ALL") return formatted
  return formatted.filter((a) => a.level === activeFilter.value)
})

// ==========================================
// Style Helpers
// ==========================================
function alertRowClass(level) {
  return {
    "row-danger":  level === "DANGER",
    "row-warning": level === "WARNING",
  }
}

function alertDotClass(level) {
  return {
    "dot-danger":  level === "DANGER",
    "dot-warning": level === "WARNING",
  }
}

function alertLevelClass(level) {
  return {
    "level-danger":  level === "DANGER",
    "level-warning": level === "WARNING",
  }
}
</script>

<style scoped>
/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 0.5px solid #D3D1C7;
  background: transparent;
  font-size: 12px;
  color: #5F5E5A;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover   { background: #F1EFE8; }
.tab-active {
  background: #2C2C2A;
  color: #F1EFE8;
  border-color: #2C2C2A;
}
.tab-count {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
.count-neutral { background: #D3D1C7; color: #2C2C2A; }
.count-danger  { background: #FCEBEB; color: #A32D2D; }
.count-warning { background: #FAEEDA; color: #854F0B; }

/* Center States */
.center-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 6px;
}
.empty-icon { font-size: 28px; }
.empty-text {
  font-size: 13px;
  font-weight: 500;
  color: #5F5E5A;
  margin: 0;
}
.empty-sub {
  font-size: 12px;
  color: #888780;
  margin: 0;
}

/* Alert List */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 260px;
  overflow-y: auto;
}
.alert-list::-webkit-scrollbar       { width: 4px; }
.alert-list::-webkit-scrollbar-track { background: transparent; }
.alert-list::-webkit-scrollbar-thumb { background: #D3D1C7; border-radius: 2px; }

/* Alert Row */
.alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 0.5px solid #F1EFE8;
}
.alert-row:last-child { border-bottom: none; }
.row-danger  { background: transparent; }
.row-warning { background: transparent; }

/* Alert Dot */
.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-danger  { background: #E24B4A; }
.dot-warning { background: #BA7517; }

/* Alert Content */
.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.alert-main {
  display: flex;
  align-items: center;
  gap: 6px;
}
.alert-level {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.level-danger  { color: #A32D2D; }
.level-warning { color: #854F0B; }

.alert-ppm {
  font-size: 12px;
  color: #5F5E5A;
}
.alert-details {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.alert-detail {
  font-size: 11px;
  color: #888780;
}
.alert-detail-sep {
  font-size: 11px;
  color: #D3D1C7;
}

/* Timestamp */
.alert-time {
  font-size: 11px;
  color: #888780;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Footer */
.footer-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888780;
}
.footer-count { font-weight: 500; color: #5F5E5A; }
</style>