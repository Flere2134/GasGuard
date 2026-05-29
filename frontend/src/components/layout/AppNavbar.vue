<!-- ==========================================
  components/layout/AppNavbar.vue
  ==========================================
  Top navigation bar for the GasGuard
  dashboard. Displays the logo, current
  system status badge, alert notification
  bell, and user logout button.
========================================== -->

<template>
  <nav class="navbar">

    <!-- Left — Logo -->
    <div class="navbar-left">
      <div class="logo">
        <img src="/gasguard-logo.png" alt="GasGuard Logo" class="navbar-logo" />
        <span class="logo-text">GasGuard</span>
      </div>
      <span class="version">v1.0</span>
    </div>

    <!-- Center — System Status Badge -->
    <div class="navbar-center">
      <div class="status-badge" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-label">{{ statusLabel }}</span>
      </div>
    </div>

    <!-- Right — Alert Bell + User Info + Logout -->
    <div class="navbar-right">

      <!-- Alert notification bell -->
      <button
        class="icon-btn"
        @click="onAlertBellClick"
        aria-label="View alerts"
      >
        <vue-feather type="bell" size="18" />
        <span
          v-if="alertStore.unreadCount > 0"
          class="badge"
        >
          {{ alertStore.unreadCount > 9 ? "9+" : alertStore.unreadCount }}
        </span>
      </button>

      <!-- User info -->
      <div class="user-info">
        <span class="user-avatar">{{ userInitial }}</span>
        <span class="user-email">{{ authStore.userName }}</span>
      </div>

      <!-- Logout button -->
      <button class="logout-btn" @click="handleLogout">
        Logout
      </button>

    </div>
  </nav>
</template>

<script setup>
import { computed }       from "vue"
import { useRouter }      from "vue-router"
import { useAuthStore }   from "@/stores/authStore"
import { useAlertStore }  from "@/stores/alertStore"
import { useSensorStore } from "@/stores/sensorStore"

const router      = useRouter()
const authStore   = useAuthStore()
const alertStore  = useAlertStore()
const sensorStore = useSensorStore()

// ==========================================
// Computed
// ==========================================
const statusLabel = computed(() => {
  if (!sensorStore.isConnected) return "Device Offline"
  return `System ${sensorStore.status}`
})

const statusClass = computed(() => {
  if (!sensorStore.isConnected) return "status-offline"
  const map = {
    SAFE:    "status-safe",
    WARNING: "status-warning",
    DANGER:  "status-danger",
  }
  return map[sensorStore.status] || "status-safe"
})

const userInitial = computed(() => {
  const name = authStore.userName || "U"
  return name.charAt(0).toUpperCase()
})

// ==========================================
// Methods
// ==========================================
function onAlertBellClick() {
  alertStore.markAllRead()
}

async function handleLogout() {
  sensorStore.clearHistory()
  alertStore.clearAlerts()
  await authStore.logout()
  router.push({ name: "Login" })
}
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: #ffffff;
  border-bottom: 0.5px solid #e0e0d8;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Left */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.navbar-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.logo-text {
  font-size: 16px;
  font-weight: 500;
  color: #2C2C2A;
}
.version {
  font-size: 11px;
  color: #888780;
  margin-top: 2px;
}

/* Center */
.navbar-center { display: flex; align-items: center; }
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Status variants */
.status-safe    { background: #EAF3DE; color: #3B6D11; }
.status-safe    .status-dot { background: #639922; }
.status-warning { background: #FAEEDA; color: #854F0B; }
.status-warning .status-dot { background: #BA7517; }
.status-danger  { background: #FCEBEB; color: #A32D2D; }
.status-danger  .status-dot { background: #E24B4A; }
.status-offline { background: #F1EFE8; color: #5F5E5A; }
.status-offline .status-dot { background: #888780; }

/* Right */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
}
.icon-btn:hover { background: #F1EFE8; }
.bell-icon { font-size: 18px; }
.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #E24B4A;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #EAF3DE;
  color: #3B6D11;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-email {
  font-size: 13px;
  color: #5F5E5A;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  font-size: 13px;
  color: #5F5E5A;
  background: none;
  border: 0.5px solid #D3D1C7;
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.logout-btn:hover { background: #F1EFE8; color: #2C2C2A; }
</style>