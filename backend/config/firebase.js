// ==========================================
// config/firebase.js
// ==========================================
// Initializes the Firebase Admin SDK for
// server-side access to Firestore database.
//
// Firebase Admin SDK allows the backend to:
//   - Read and write to Firestore
//   - Verify Firebase Auth tokens
//   - Send push notifications (if needed)
//
// This module exports the Firestore instance
// used by all services that need database
// access (alertService, telemetryService).
// ==========================================

const admin  = require("firebase-admin");
const logger = require("../utils/logger");

// ==========================================
// Internal State
// ==========================================
let db             = null;
let isInitialized  = false;

// ==========================================
// initFirebase()
// ==========================================
// Initializes the Firebase Admin SDK using
// service account credentials stored in
// the backend .env file.
//
// Called once at server startup in server.js
// before any service or route accesses the
// database.
//
// Credentials needed in .env:
//   FIREBASE_PROJECT_ID
//   FIREBASE_PRIVATE_KEY
//   FIREBASE_CLIENT_EMAIL
//
// HOW TO GET THESE:
//   1. Go to Firebase Console
//   2. Project Settings → Service Accounts
//   3. Click "Generate New Private Key"
//   4. Open the downloaded JSON file
//   5. Copy the three values into .env
// ==========================================
function initFirebase() {
  if (isInitialized) {
    logger.warn("Firebase", "Already initialized — skipping.");
    return;
  }

  // Validate that all required env vars are set
  const requiredVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    logger.error(
      "Firebase",
      "Missing required environment variables:",
      missingVars
    );
    throw new Error(
      `Firebase initialization failed — missing: ${missingVars.join(", ")}`
    );
  }

  try {
    // Build the service account credentials
    // from environment variables.
    //
    // Note: FIREBASE_PRIVATE_KEY contains literal
    // \n characters in the .env file. The replace()
    // call converts them to actual newlines which
    // the Firebase SDK requires to parse the key.
    const serviceAccount = {
      type:                        "service_account",
      project_id:                  process.env.FIREBASE_PROJECT_ID,
      private_key:                 process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email:                process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Initialize the Firebase Admin app
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    // Get the Firestore database instance
    db = admin.firestore();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true, // Prevents errors when logging null sensor values
    });

    isInitialized = true;

    logger.info("Firebase", "Admin SDK initialized successfully.");
    logger.info("Firebase", `Project: ${process.env.FIREBASE_PROJECT_ID}`);

  } catch (err) {
    logger.error("Firebase", "Initialization failed.", err.message);
    throw err;
  }
}

// ==========================================
// getDB()
// ==========================================
// Returns the Firestore database instance.
// Called by services that need to read or
// write data to the database.
//
// Throws an error if accessed before
// initFirebase() has been called — this
// prevents silent failures where services
// try to use an uninitialized database.
// ==========================================
function getDB() {
  if (!db) {
    const msg = "Firestore accessed before initialization. Call initFirebase() first.";
    logger.error("Firebase", msg);
    throw new Error(msg);
  }

  return db;
}

// ==========================================
// getAdmin()
// ==========================================
// Returns the Firebase Admin instance.
// Used by auth middleware to verify
// Firebase Auth ID tokens from the
// Vue dashboard login.
// ==========================================
function getAdmin() {
  if (!isInitialized) {
    const msg = "Firebase Admin accessed before initialization.";
    logger.error("Firebase", msg);
    throw new Error(msg);
  }

  return admin;
}

// ==========================================
// Firestore Collection Names
// ==========================================
// Centralized collection name constants
// so all services reference the same
// collection paths consistently.
//
// Firestore structure:
//
//   gasguard_telemetry/          ← latest sensor snapshot
//     └── latest (document)
//
//   gasguard_alerts/             ← alert event log
//     └── {auto-id} (documents)
//         ├── level
//         ├── ppm
//         ├── valve
//         ├── fan
//         ├── timestamp
//         └── device
//
//   gasguard_devices/            ← device registry
//     └── GasGuard-v1 (document)
//         ├── ip
//         ├── uptime
//         ├── lastSeen
//         └── status
// ==========================================
const COLLECTIONS = {
  TELEMETRY : "gasguard_telemetry",
  ALERTS    : "gasguard_alerts",
  DEVICES   : "gasguard_devices",
};

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  initFirebase,
  getDB,
  getAdmin,
  COLLECTIONS,
};