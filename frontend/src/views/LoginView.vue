<!-- ==========================================
  views/LoginView.vue
  ==========================================
  Login page for the GasGuard dashboard.
  Authenticated users are redirected to
  the dashboard automatically.

  Features:
    - Email and password login form
    - Firebase Auth error messages
    - Loading state during sign in
    - Redirect to intended page after login
    - GasGuard branding
========================================== -->

<template>
  <div class="login-page">

    <!-- Left Panel — Branding -->
    <div class="login-left">
      <div class="brand">
        <span class="brand-icon">🔥</span>
        <h1 class="brand-name">GasGuard</h1>
        <p class="brand-tagline">
          IoT-Based LPG Leak Detection<br>and Safety System
        </p>
      </div>

      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">📡</span>
          <span class="feature-text">Real-time gas monitoring</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔔</span>
          <span class="feature-text">Instant leak alerts</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🎛️</span>
          <span class="feature-text">Remote valve and fan control</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📈</span>
          <span class="feature-text">Live sensor data dashboard</span>
        </div>
      </div>

      <p class="left-footer">
        Group 5 — IoT Systems Design
      </p>
    </div>

    <!-- Right Panel — Login Form -->
    <div class="login-right">
      <div class="login-card">

        <!-- Header -->
        <div class="login-header">
          <span class="login-icon">🔐</span>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-sub">Sign in to access your dashboard</p>
        </div>

        <!-- Form -->
        <form class="login-form" @submit.prevent="handleLogin">

          <!-- Email Field -->
          <div class="field">
            <label class="field-label" for="email">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="field-input"
              :class="{ 'field-error': authStore.error }"
              placeholder="family@email.com"
              autocomplete="email"
              required
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Password Field -->
          <div class="field">
            <label class="field-label" for="password">Password</label>
            <div class="password-wrap">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                :class="{ 'field-error': authStore.error }"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                :disabled="authStore.isLoading"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                {{ showPassword ? "🙈" : "👁️" }}
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <transition name="fade">
            <div v-if="authStore.error" class="error-msg">
              ❌ {{ authStore.error }}
            </div>
          </transition>

          <!-- Submit Button -->
          <button
            type="submit"
            class="login-btn"
            :disabled="authStore.isLoading || !email || !password"
          >
            <span v-if="authStore.isLoading" class="btn-loading">
              <span class="btn-spinner"></span>
              Signing in...
            </span>
            <span v-else>Sign in</span>
          </button>

        </form>

        <!-- Footer -->
        <p class="form-footer">
          Access is restricted to registered family members.<br>
          Contact the system administrator to request access.
        </p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref }            from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore }   from "@/stores/authStore"

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const email        = ref("")
const password     = ref("")
const showPassword = ref(false)

// ==========================================
// handleLogin()
// ==========================================
async function handleLogin() {
  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    // Redirect to intended page or dashboard
    const redirect = route.query.redirect || "/dashboard"
    router.push(redirect)
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: #F1EFE8;
}

/* Left Panel */
.login-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
  background: #2C2C2A;
  gap: 40px;
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brand-icon  { font-size: 40px; }
.brand-name  {
  font-size: 32px;
  font-weight: 600;
  color: #F1EFE8;
  margin: 0;
}
.brand-tagline {
  font-size: 15px;
  color: #888780;
  line-height: 1.6;
  margin: 0;
}
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.feature-icon  { font-size: 18px; }
.feature-text  { font-size: 14px; color: #D3D1C7; }
.left-footer   { font-size: 12px; color: #5F5E5A; margin: 0; }

/* Right Panel */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
.login-card {
  background: #ffffff;
  border: 0.5px solid #e0e0d8;
  border-radius: 16px;
  padding: 36px 32px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Header */
.login-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.login-icon  { font-size: 28px; }
.login-title {
  font-size: 22px;
  font-weight: 600;
  color: #2C2C2A;
  margin: 0;
}
.login-sub {
  font-size: 14px;
  color: #888780;
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #5F5E5A;
}
.field-input {
  padding: 10px 12px;
  border: 0.5px solid #D3D1C7;
  border-radius: 8px;
  font-size: 14px;
  color: #2C2C2A;
  background: #ffffff;
  outline: none;
  transition: border-color 0.15s;
}
.field-input:focus   { border-color: #639922; }
.field-input.field-error { border-color: #E24B4A; }
.field-input:disabled { background: #F1EFE8; cursor: not-allowed; }

/* Password toggle */
.password-wrap {
  position: relative;
}
.password-wrap .field-input {
  width: 100%;
  padding-right: 40px;
  box-sizing: border-box;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  opacity: 0.6;
}
.password-toggle:hover { opacity: 1; }

/* Error message */
.error-msg {
  font-size: 13px;
  color: #A32D2D;
  background: #FCEBEB;
  border: 0.5px solid #E24B4A;
  border-radius: 8px;
  padding: 8px 12px;
}

/* Login Button */
.login-btn {
  padding: 11px;
  background: #2C2C2A;
  color: #F1EFE8;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.login-btn:hover:not(:disabled) { background: #3D3D3A; }
.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Form footer */
.form-footer {
  font-size: 12px;
  color: #888780;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

/* Responsive — stack on small screens */
@media (max-width: 768px) {
  .login-page  { flex-direction: column; }
  .login-left  { padding: 32px 24px; gap: 24px; flex: none; }
  .login-right { flex: 1; padding: 24px; }
}
</style>