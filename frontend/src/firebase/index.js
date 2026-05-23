// ==========================================
// firebase/index.js
// ==========================================
// Initializes the Firebase client SDK for
// the GasGuard Vue 3 frontend.
//
// Provides:
//   - Firebase Auth  (login/logout)
//   - Firestore      (real-time data)
//
// This is the CLIENT SDK — different from
// the Admin SDK used in the backend.
// The client SDK is safe to use in the
// browser and only accesses data allowed
// by Firestore security rules.
//
// All credentials come from .env variables
// prefixed with VITE_ so Vite exposes them
// to the browser bundle.
// ==========================================

import { initializeApp }        from "firebase/app";
import { getAuth }              from "firebase/auth";
import { getFirestore }         from "firebase/firestore";
import { getAnalytics,
         isSupported }          from "firebase/analytics";

// ==========================================
// Firebase Config
// ==========================================
// Values loaded from frontend/.env
// All must be prefixed with VITE_ to be
// accessible via import.meta.env
// ==========================================
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ==========================================
// Validate Config
// ==========================================
// Catches missing .env values early with
// a clear error message instead of a cryptic
// Firebase SDK error later at runtime.
// ==========================================
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

requiredKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    console.error(
      `[Firebase] Missing environment variable: VITE_FIREBASE_${key
        .replace(/([A-Z])/g, "_$1")
        .toUpperCase()}`
    );
  }
});

// ==========================================
// Initialize Firebase App
// ==========================================
// initializeApp() must be called once before
// any Firebase service (auth, firestore) is
// accessed. Calling it multiple times throws
// an error — the check below prevents that
// during hot module replacement in dev.
// ==========================================
const app = initializeApp(firebaseConfig);

// ==========================================
// Firebase Auth Instance
// ==========================================
// Used by:
//   - authStore.js  (login, logout, state)
//   - auth.js middleware equivalent in Vue
//   - router/index.js (navigation guards)
// ==========================================
const auth = getAuth(app);

// ==========================================
// Firestore Instance
// ==========================================
// Used by:
//   - composables/useRealtime.js
//     (real-time sensor data listener)
//   - alertStore.js
//     (fetching alert history)
// ==========================================
const db = getFirestore(app);

// ==========================================
// Firebase Analytics (Optional)
// ==========================================
// Only initialized if the browser supports
// it — analytics is not available in some
// environments (e.g. private browsing,
// certain mobile browsers).
// Non-critical — failure is silently ignored.
// ==========================================
let analytics = null;

isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("[Firebase] Analytics initialized.");
  }
}).catch(() => {
  console.log("[Firebase] Analytics not supported in this environment.");
});

// ==========================================
// Firestore Collection Names
// ==========================================
// Mirrors the COLLECTIONS constants from
// the backend config/firebase.js so both
// ends always reference the same paths.
//
// Firestore structure:
//   gasguard_telemetry/latest    ← live sensor snapshot
//   gasguard_alerts/{auto-id}    ← alert event log
//   gasguard_devices/{device}    ← device registry
// ==========================================
export const COLLECTIONS = {
  TELEMETRY : "gasguard_telemetry",
  ALERTS    : "gasguard_alerts",
  DEVICES   : "gasguard_devices",
};

// ==========================================
// Exports
// ==========================================
export { app, auth, db, analytics };
export default app;