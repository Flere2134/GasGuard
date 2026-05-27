<!-- ==========================================
  components/dashboard/OverridePanel.vue
  ==========================================
  Allows the user to manually control the
  exhaust fan and gas valve remotely from
  the Vue dashboard.

  Features:
    - Toggle switches for fan and valve
    - Confirmation dialog before closing valve
    - Success and error feedback messages
    - Override history log
    - Disabled state while command is sending
========================================== -->

<template>
  <BaseCard title="Manual Overrides">
    <template #icon>
      <vue-feather type="sliders" size="14" />
    </template>

    <!-- Warning Banner -->
    <div class="warning-banner">
      <vue-feather type="alert-triangle" size="14" class="warning-icon" />
      <span class="warning-text">
        Manual overrides bypass automatic safety logic.
        Use with caution.
      </span>
    </div>

    <!-- Controls -->
    <div class="controls">

      <!-- Exhaust Fan Toggle -->
      <div class="control-row">
        <div class="control-info">
          <vue-feather type="wind" size="20" />
          <div class="control-details">
            <span class="control-label">Exhaust Fan</span>
            <span
              class="control-status"
              :class="sensorStore.isFanRunning ? 'status-on' : 'status-off'"
            >
              {{ sensorStore.isFanRunning ? "Running" : "Off" }}
            </span>
          </div>
        </div>
        <button
          class="toggle-btn"
          :class="sensorStore.isFanRunning ? 'toggle-active' : 'toggle-inactive'"
          :disabled="override.isLoading.value"
          @click="handleFanToggle"
          :aria-label="sensorStore.isFanRunning ? 'Turn fan off' : 'Turn fan on'"
        >
          <span class="toggle-thumb"></span>
        </button>
      </div>

      <div class="control-divider"></div>

      <!-- Gas Valve Toggle -->
      <div class="control-row">
        <div class="control-info">
          <vue-feather type="settings" size="20" />
          <div class="control-details">
            <span class="control-label">Gas Valve</span>
            <span
              class="control-status"
              :class="sensorStore.isValveClosed ? 'status-closed' : 'status-open'"
            >
              {{ sensorStore.isValveClosed ? "Closed" : "Open" }}
            </span>
          </div>
        </div>
        <button
          class="toggle-btn"
          :class="!sensorStore.isValveClosed ? 'toggle-active' : 'toggle-inactive'"
          :disabled="override.isLoading.value"
          @click="handleValveToggle"
          :aria-label="sensorStore.isValveClosed ? 'Open valve' : 'Close valve'"
        >
          <span class="toggle-thumb"></span>
        </button>
      </div>

    </div>

    <!-- Feedback Messages -->
    <transition name="fade">
      <div v-if="override.lastResult.value" class="feedback feedback-success">
        ✅ {{ override.lastResult.value }}
      </div>
    </transition>

    <transition name="fade">
      <div v-if="override.error.value" class="feedback feedback-error">
        ❌ {{ override.error.value }}
        <button class="feedback-close" @click="override.clearError()">✕</button>
      </div>
    </transition>

    <!-- Sending indicator -->
    <div v-if="override.isLoading.value" class="sending-row">
      <LoadingSpinner size="sm" />
      <span class="sending-text">Sending command...</span>
    </div>

    <div class="section-divider"></div>

    <!-- Override History -->
    <div class="history-header">
      <span class="history-title">Recent Commands</span>
    </div>

    <div
      v-if="override.history.value.length === 0"
      class="history-empty"
    >
      No commands sent this session.
    </div>

    <div v-else class="history-list">
      <div
        v-for="(item, idx) in override.history.value"
        :key="idx"
        class="history-row"
      >
        <span
          class="history-dot"
          :class="item.success ? 'dot-success' : 'dot-fail'"
        ></span>
        <span class="history-text">
          {{ item.device === "fan" ? "Fan" : "Valve" }}
          →
          <strong>{{ item.state }}</strong>
        </span>
        <span class="history-time">{{ formatTimestamp(item.time) }}</span>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="footer-row">
        <span class="footer-text">Commands are sent via MQTT</span>
        <span
          class="footer-status"
          :class="sensorStore.isConnected ? 'footer-online' : 'footer-offline'"
        >
          {{ sensorStore.isConnected ? "● Device Online" : "○ Device Offline" }}
        </span>
      </div>
    </template>

  </BaseCard>

  <!-- Valve Close Confirmation Dialog -->
  <Teleport to="body">
    <div v-if="showValveConfirm" class="dialog-overlay" @click.self="showValveConfirm = false">
      <div class="dialog">
        <div class="dialog-icon">⚠️</div>
        <h3 class="dialog-title">Close Gas Valve?</h3>
        <p class="dialog-body">
          This will physically close the LPG valve and cut off the gas supply.
          Make sure this is intentional before proceeding.
        </p>
        <div class="dialog-actions">
          <button class="dialog-cancel" @click="showValveConfirm = false">
            Cancel
          </button>
          <button class="dialog-confirm" @click="confirmCloseValve">
            Yes, Close Valve
          </button>
        </div>
      </div>
    </div>
  </Teleport>

</template>

<script setup>
import { ref }              from "vue"
import BaseCard             from "@/components/common/BaseCard.vue"
import LoadingSpinner       from "@/components/common/LoadingSpinner.vue"
import { useSensorStore }   from "@/stores/sensorStore"
import { useOverride }      from "@/composables/useOverride"
import { formatTimestamp }  from "@/utils/thresholds"

const sensorStore       = useSensorStore()
const override          = useOverride()
const showValveConfirm  = ref(false)

// ==========================================
// Fan Toggle Handler (UPDATED)
// ==========================================
async function handleFanToggle() {
  // 1. Calculate the desired state
  const turnOn = !sensorStore.isFanRunning;
  
  // 2. Send the command via the composable
  const result = await override.sendFanOverride(turnOn);
  
  // 3. Optimistic Update: If the API says success, flip the UI switch
  if (result.success) {
    sensorStore.isFanRunning = turnOn;
  }
}

// ==========================================
// Valve Toggle Handlers (UPDATED)
// ==========================================
async function handleValveToggle() {
  if (!sensorStore.isValveClosed) {
    showValveConfirm.value = true;
  } else {
    // Valve is closed -> opening it
    const result = await override.sendValveOverride(true);
    if (result.success) {
      sensorStore.isValveClosed = false; // Optimistic Update
    }
  }
}

async function confirmCloseValve() {
  showValveConfirm.value = false;
  
  const result = await override.sendValveOverride(false);
  
  if (result.success) {
    sensorStore.isValveClosed = true; // Optimistic Update
  }
}
</script>

<style scoped>
/* Warning Banner */
.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #FAEEDA;
  border: 0.5px solid #BA7517;
  border-radius: 8px;
  margin-bottom: 14px;
}
.warning-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.warning-text { font-size: 12px; color: #854F0B; line-height: 1.5; }

/* Controls */
.controls { display: flex; flex-direction: column; gap: 0; }
.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}
.control-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.control-icon  { font-size: 20px; }
.control-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.control-label  { font-size: 14px; font-weight: 500; color: #2C2C2A; }
.control-status { font-size: 12px; }
.status-on     { color: #3B6D11; }
.status-off    { color: #888780; }
.status-open   { color: #3B6D11; }
.status-closed { color: #A32D2D; }

/* Toggle Button */
.toggle-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.toggle-active   { background: #639922; }
.toggle-inactive { background: #D3D1C7; }
.toggle-thumb {
  position: absolute;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-active   .toggle-thumb { left: 23px; }
.toggle-inactive .toggle-thumb { left: 3px;  }

.control-divider {
  height: 0.5px;
  background: #F1EFE8;
}

/* Feedback */
.feedback {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 10px;
}
.feedback-success {
  background: #EAF3DE;
  color: #3B6D11;
  border: 0.5px solid #639922;
}
.feedback-error {
  background: #FCEBEB;
  color: #A32D2D;
  border: 0.5px solid #E24B4A;
}
.feedback-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: inherit;
  padding: 0 4px;
  opacity: 0.7;
}
.feedback-close:hover { opacity: 1; }

/* Sending Indicator */
.sending-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.sending-text {
  font-size: 13px;
  color: #888780;
}

/* Section Divider */
.section-divider {
  height: 0.5px;
  background: #e0e0d8;
  margin: 12px 0;
}

/* Override History */
.history-header { margin-bottom: 8px; }
.history-title  { font-size: 12px; font-weight: 500; color: #5F5E5A; }
.history-empty  { font-size: 12px; color: #888780; padding: 4px 0; }
.history-list   { display: flex; flex-direction: column; gap: 6px; }
.history-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #5F5E5A;
}
.history-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-success { background: #639922; }
.dot-fail    { background: #E24B4A; }
.history-text { flex: 1; }
.history-time { color: #888780; white-space: nowrap; }

/* Footer */
.footer-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888780;
}
.footer-online  { color: #3B6D11; font-weight: 500; }
.footer-offline { color: #888780; }

/* Confirmation Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.dialog {
  background: #ffffff;
  border-radius: 16px;
  padding: 28px 24px;
  max-width: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.dialog-icon  { font-size: 36px; }
.dialog-title { font-size: 18px; font-weight: 600; color: #2C2C2A; margin: 0; }
.dialog-body  { font-size: 14px; color: #5F5E5A; line-height: 1.6; margin: 0; }
.dialog-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 4px;
}
.dialog-cancel {
  flex: 1;
  padding: 10px;
  border: 0.5px solid #D3D1C7;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  color: #5F5E5A;
  cursor: pointer;
  transition: background 0.15s;
}
.dialog-cancel:hover  { background: #F1EFE8; }
.dialog-confirm {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #E24B4A;
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.dialog-confirm:hover { background: #C93A39; }

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>