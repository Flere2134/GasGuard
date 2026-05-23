<!-- ==========================================
  components/common/LoadingSpinner.vue
  ==========================================
  Reusable loading spinner component shown
  while data is being fetched or the app
  is waiting for auth state to resolve.

  Props:
    size    — "sm" | "md" | "lg" (default: "md")
    message — optional loading text below spinner
    full    — if true, centers in full viewport
========================================== -->

<template>
  <div class="spinner-wrapper" :class="{ 'spinner-full': full }">
    <div class="spinner" :class="`spinner-${size}`"></div>
    <p v-if="message" class="spinner-message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size:    { type: String,  default: "md"    },
  message: { type: String,  default: null    },
  full:    { type: Boolean, default: false   },
})
</script>

<style scoped>
.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
}
.spinner-full {
  position: fixed;
  inset: 0;
  background: #ffffff;
  z-index: 999;
}
.spinner {
  border-radius: 50%;
  border: 2px solid #e0e0d8;
  border-top-color: #639922;
  animation: spin 0.7s linear infinite;
}
.spinner-sm { width: 18px; height: 18px; }
.spinner-md { width: 28px; height: 28px; }
.spinner-lg { width: 40px; height: 40px; border-width: 3px; }

.spinner-message {
  font-size: 14px;
  color: #888780;
  margin: 0;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>