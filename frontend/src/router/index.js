// ==========================================
// router/index.js
// ==========================================
// Vue Router configuration for the GasGuard
// Vue 3 frontend.
//
// Routes:
//   /          → redirects to /dashboard
//   /login     → LoginView.vue (public)
//   /dashboard → DashboardView.vue (protected)
//
// Navigation Guards:
//   - Redirects unauthenticated users to /login
//   - Redirects authenticated users away from /login
//   - Waits for auth state to resolve before
//     allowing any navigation
// ==========================================

import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore }                   from "@/stores/authStore"

// ==========================================
// Lazy-loaded Route Components
// ==========================================
// Using dynamic imports so each view is
// only loaded when the route is first visited.
// This reduces the initial bundle size and
// speeds up the first page load.
// ==========================================
const LoginView     = () => import("@/views/LoginView.vue")
const DashboardView = () => import("@/views/DashboardView.vue")

// ==========================================
// Route Definitions
// ==========================================
const routes = [
  // Root redirect
  {
    path:     "/",
    redirect: "/dashboard",
  },

  // Login page — public
  {
    path:      "/login",
    name:      "Login",
    component: LoginView,
    meta: {
      requiresAuth: false,
      title:        "GasGuard — Login",
    },
  },

  // Dashboard — protected
  {
    path:      "/dashboard",
    name:      "Dashboard",
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title:        "GasGuard — Dashboard",
    },
  },

  // Catch-all 404 — redirect to dashboard
  // If the user types an unknown URL,
  // send them to the dashboard which will
  // redirect to login if not authenticated
  {
    path:     "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
]

// ==========================================
// Router Instance
// ==========================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  // Scroll to top on every route change
  scrollBehavior() {
    return { top: 0 }
  },
})

// ==========================================
// Navigation Guard
// ==========================================
// Runs before every route navigation.
//
// Logic:
//   1. Update the browser tab title
//   2. Wait for auth state to resolve
//      (prevents redirect flicker on refresh)
//   3. If route requires auth and user is
//      not logged in → redirect to /login
//   4. If route is /login and user is already
//      logged in → redirect to /dashboard
//   5. Otherwise → allow navigation
// ==========================================
router.beforeEach(async (to, from, next) => {
  // Step 1 — Update browser tab title
  document.title = to.meta.title || "GasGuard"

  const authStore = useAuthStore()

  // Step 2 — Wait for auth state to resolve
  // On page refresh, Firebase needs a moment
  // to check if the user has an active session.
  // isLoading is true until onAuthStateChanged
  // fires for the first time in initAuth().
  if (authStore.isLoading) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!authStore.isLoading) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
  }

  const requiresAuth = to.meta.requiresAuth
  const isLoggedIn   = authStore.isLoggedIn

  // Step 3 — Protected route, not logged in
  if (requiresAuth && !isLoggedIn) {
    console.log("[Router] Unauthenticated — redirecting to /login")
    return next({
      name:  "Login",
      query: { redirect: to.fullPath }, // Remember where they were going
    })
  }

  // Step 4 — Already logged in, trying to visit login
  if (to.name === "Login" && isLoggedIn) {
    console.log("[Router] Already authenticated — redirecting to /dashboard")
    return next({ name: "Dashboard" })
  }

  // Step 5 — Allow navigation
  next()
})

export default router