// ==========================================
// main.js
// ==========================================
// GasGuard Vue 3 Application Entry Point
//
// Startup sequence:
//   1. Create Vue app
//   2. Register Pinia (state management)
//   3. Register Vue Router
//   4. Initialize Firebase Auth listener
//   5. Mount the app to the DOM
// ==========================================

import { createApp }    from "vue"
import { createPinia }  from "pinia"
import App              from "./App.vue"
import router           from "./router"
import { useAuthStore } from "./stores/authStore"

// Import global styles
import "./assets/styles/main.css"

// ==========================================
// Create Vue App
// ==========================================
const app = createApp(App)

// ==========================================
// Register Plugins
// ==========================================
const pinia = createPinia()
app.use(pinia)
app.use(router)

// ==========================================
// Initialize Firebase Auth
// ==========================================
// Must happen AFTER pinia is registered
// since useAuthStore() needs pinia active.
//
// We await initAuth() before mounting so
// the router navigation guards have the
// correct auth state on the very first
// navigation — prevents login page flicker
// on page refresh for logged-in users.
// ==========================================
const authStore = useAuthStore()

authStore.initAuth().then(() => {
  // Mount the app only after auth state
  // is known for the first time
  app.mount("#app")
  console.log("[GasGuard] App mounted successfully.")
})