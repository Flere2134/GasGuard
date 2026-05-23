// ==========================================
// stores/authStore.js
// ==========================================
// Pinia store that manages Firebase Auth
// state for the GasGuard Vue 3 dashboard.
//
// Responsibilities:
//   - Track current logged-in user
//   - Handle login and logout actions
//   - Listen for auth state changes
//   - Guard dashboard access
// ==========================================

import { defineStore }              from "pinia"
import { ref, computed }            from "vue"
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
}                                   from "firebase/auth"
import { auth }                     from "@/firebase"

export const useAuthStore = defineStore("auth", () => {

  // ==========================================
  // State
  // ==========================================
  const user        = ref(null)     // Firebase user object
  const isLoading   = ref(true)     // true while auth state is resolving
  const error       = ref(null)     // login error message

  // ==========================================
  // Getters
  // ==========================================
  const isLoggedIn   = computed(() => !!user.value)
  const userEmail    = computed(() => user.value?.email  || null)
  const userName     = computed(() => user.value?.displayName || user.value?.email || "User")

  // ==========================================
  // initAuth()
  // ==========================================
  // Starts a persistent Firebase Auth listener
  // that fires whenever the user logs in,
  // logs out, or the token refreshes.
  //
  // Called once in main.js before the app
  // mounts so the auth state is always known
  // before any route guard runs.
  //
  // Returns a promise that resolves once the
  // initial auth state is determined — prevents
  // the app from briefly flashing the login
  // page before confirming a logged-in user.
  // ==========================================
  function initAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value      = firebaseUser
        isLoading.value = false
        error.value     = null
        resolve(firebaseUser)
      })
    })
  }

  // ==========================================
  // login()
  // ==========================================
  // Signs in a user with email and password
  // using Firebase Auth.
  //
  // Parameters:
  //   email    — user's email address
  //   password — user's password
  //
  // Returns { success: true } on success
  // Returns { success: false, message } on fail
  // ==========================================
  async function login(email, password) {
    isLoading.value = true
    error.value     = null

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      user.value       = credential.user

      console.log(`[Auth] Logged in as: ${user.value.email}`)
      return { success: true }

    } catch (err) {
      // Map Firebase error codes to user-friendly messages
      error.value = mapFirebaseError(err.code)
      console.error(`[Auth] Login failed: ${err.code}`)
      return { success: false, message: error.value }

    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // logout()
  // ==========================================
  // Signs out the current user and clears
  // the local user state.
  // Router guard in router/index.js will
  // automatically redirect to login page.
  // ==========================================
  async function logout() {
    try {
      await signOut(auth)
      user.value  = null
      error.value = null
      console.log("[Auth] Logged out successfully.")
    } catch (err) {
      console.error("[Auth] Logout failed:", err.message)
    }
  }

  // ==========================================
  // mapFirebaseError()
  // ==========================================
  // Converts Firebase Auth error codes into
  // human-readable messages for display in
  // the login form.
  // ==========================================
  function mapFirebaseError(code) {
    const errors = {
      "auth/invalid-email":           "Invalid email address.",
      "auth/user-disabled":           "This account has been disabled.",
      "auth/user-not-found":          "No account found with this email.",
      "auth/wrong-password":          "Incorrect password. Please try again.",
      "auth/invalid-credential":      "Invalid email or password.",
      "auth/too-many-requests":       "Too many failed attempts. Try again later.",
      "auth/network-request-failed":  "Network error. Check your connection.",
    }
    return errors[code] || "Login failed. Please try again."
  }

  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    userEmail,
    userName,
    initAuth,
    login,
    logout,
  }
})