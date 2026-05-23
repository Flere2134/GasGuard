<!-- ==========================================
  App.vue
  ==========================================
  Root Vue component for GasGuard.

  Responsibilities:
    - Render the router-view (Login or Dashboard)
    - Show a full-screen loading spinner while
      Firebase Auth state is resolving on
      initial page load or refresh
    - Apply global page transition animation
========================================== -->

<template>
  <div id="app-root">

    <!-- Full screen loading while auth resolves -->
    <LoadingSpinner
      v-if="authStore.isLoading"
      size="lg"
      message="Starting GasGuard..."
      full
    />

    <!-- Router view with page transition -->
    <RouterView v-else v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

  </div>
</template>

<script setup>
import { RouterView }     from "vue-router"
import LoadingSpinner     from "@/components/common/LoadingSpinner.vue"
import { useAuthStore }   from "@/stores/authStore"

const authStore = useAuthStore()
</script>

<style>
/* ==========================================
   Global Styles applied via App.vue
   (not scoped — applies to entire app)
========================================== */

/* Page transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>