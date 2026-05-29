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
        <img src="/gasguard-text-logo.png" alt="GasGuard Logo" class="brand-logo" />
        <p class="brand-tagline">
          IoT-Based LPG Leak Detection<br>and Safety System
        </p>
      </div>

      <div class="feature-list">
        <div class="feature-item">
          <vue-feather type="radio" size="18" style="color:#1B1212"/>
          <span class="feature-text">Real-time gas monitoring</span>
        </div>
        <div class="feature-item">
          <vue-feather type="bell" size="18" style="color:#1B1212"/>
          <span class="feature-text">Instant leak alerts</span>
        </div>
        <div class="feature-item">
          <vue-feather type="sliders" size="18" style="color:#1B1212"/>
          <span class="feature-text">Remote valve and fan control</span>
        </div>
        <div class="feature-item">
          <vue-feather type="trending-up" size="18" style="color:#1B1212"/>
          <span class="feature-text">Live sensor data dashboard</span>
        </div>
      </div>
    </div>

    <!-- Right Panel — Login Form -->
    <div class="login-right">
      <div class="login-card">

        <!-- Header -->
        <div class="login-header">
          <vue-feather type="lock" size="28" />
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
                <!-- Eye icon — show when password is hidden -->
                <svg
                  v-if="!showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>

                <!-- Eye-off icon — show when password is visible -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="16" height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                          a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
                          a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1"  y1="1"  x2="23" y2="23"/>
                </svg>
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
  background: #F0EAD6;
  gap: 40px;
}
.brand {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brand-logo {
  width: 220px;
  height: auto;
  object-fit: contain;
}

.brand-tagline {
  font-size: 15px;
  color: #32312a;
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
.feature-text  { font-size: 14px; color: #32312a; }
.left-footer   { font-size: 12px; color: #85847e; margin: 0; }

/* Right Panel */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}
.login-card {
  background: #f4efeb;
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
  padding: 4px;
  color: #888780;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.15s;
}
.password-toggle:hover { color:#2C2C2A; }

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