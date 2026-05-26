// ==========================================
// server.js
// ==========================================
// GasGuard Backend Entry Point
//
// Startup sequence:
//   1. Load environment variables
//   2. Initialize logger
//   3. Initialize Firebase Admin SDK
//   4. Initialize MQTT client
//   5. Initialize services (telemetry, alert)
//   6. Create Express app
//   7. Register middleware
//   8. Mount API routes
//   9. Register error handlers
//  10. Start HTTP server
// ==========================================

require("dotenv").config();

const express            = require("express");
const cors               = require("cors");
const helmet             = require("helmet");
const logger             = require("./utils/logger");
const { initFirebase }   = require("./config/firebase");
const { initMQTT }       = require("./config/mqtt");
const { initTelemetryService } = require("./services/telemetryService");
const { initAlertService }     = require("./services/alertService");
const routes             = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// ==========================================
// Environment Variables
// ==========================================
const PORT     = process.env.PORT     || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ==========================================
// Startup Banner
// ==========================================
logger.separator("GasGuard Backend Server");
logger.info("Server", `Environment : ${NODE_ENV}`);
logger.info("Server", `Port        : ${PORT}`);

// ==========================================
// Step 1 — Initialize Firebase
// ==========================================
try {
  initFirebase();
} catch (err) {
  logger.error("Server", "Firebase initialization failed. Exiting.", err.message);
  process.exit(1); // Fatal — cannot run without database
}

// ==========================================
// Step 2 — Initialize MQTT
// ==========================================
try {
  initMQTT();
} catch (err) {
  logger.error("Server", "MQTT initialization failed. Exiting.", err.message);
  process.exit(1); // Fatal — cannot receive sensor data without MQTT
}

// ==========================================
// Step 3 — Initialize Services
// ==========================================
// Register MQTT message handlers so incoming
// telemetry and alert payloads are processed
// ==========================================
initTelemetryService();
initAlertService();

// ==========================================
// Step 4 — Create Express App
// ==========================================
const app = express();

// ==========================================
// Step 5 — Global Middleware
// ==========================================

// helmet — sets secure HTTP response headers
// Protects against common web vulnerabilities
// like clickjacking, XSS, and sniffing attacks
app.use(helmet());

// cors — allows the Vue frontend (running on
// a different port) to make API requests.
// In production, restrict origin to your
// actual frontend domain.
app.use(cors({
  origin: function (origin, callback) {
    if (NODE_ENV === "production") {
      // Strict in production
      if (origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Permissive in development (allows localhost, 127.0.0.1, and local Network IPs)
      callback(null, true);
    }
  },
  methods:            ["GET", "POST"],
  allowedHeaders:     ["Content-Type", "Authorization"],
  credentials:        true,
}));

// express.json — parses incoming JSON request
// bodies so req.body is available in routes
app.use(express.json());

// Request logger — logs every incoming request
app.use((req, res, next) => {
  logger.debug("HTTP", `${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// Step 6 — Mount API Routes
// ==========================================
// All routes are prefixed with /api
// Defined in routes/index.js
// ==========================================
app.use("/api", routes);

// ==========================================
// Step 7 — Root Route
// ==========================================
// Simple confirmation that the server is up.
// Accessible without auth at GET /
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success : true,
    name    : "GasGuard Backend API",
    version : "1.0.0",
    status  : "running",
    docs    : {
      status    : "GET  /api/status",
      health    : "GET  /api/status/health",
      alerts    : "GET  /api/alerts",
      history   : "GET  /api/alerts/history",
      overrides : "POST /api/overrides",
      ovHistory : "GET  /api/overrides/history",
    },
  });
});

// ==========================================
// Step 8 — Error Handlers
// ==========================================
// Must be registered AFTER all routes.
// notFound catches undefined routes (404)
// errorHandler catches all thrown errors
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// Step 9 — Start HTTP Server
// ==========================================
const server = app.listen(PORT, () => {
  logger.separator("Server Running");
  logger.info("Server", `HTTP server started on port ${PORT}`);
  logger.info("Server", `Local: http://localhost:${PORT}`);
  logger.info("Server", `Health check: http://localhost:${PORT}/api/status/health`);
});

// ==========================================
// Graceful Shutdown
// ==========================================
// Handles SIGINT (Ctrl+C) and SIGTERM
// (process manager shutdown) gracefully.
//
// On shutdown:
//   1. Stop accepting new connections
//   2. Log shutdown event
//   3. Exit cleanly
// ==========================================
function gracefulShutdown(signal) {
  logger.warn("Server", `${signal} received — shutting down gracefully...`);

  server.close(() => {
    logger.info("Server", "HTTP server closed.");
    logger.info("Server", "GasGuard backend stopped.");
    process.exit(0);
  });

  // Force exit if server hasn't closed in 10s
  setTimeout(() => {
    logger.error("Server", "Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ==========================================
// Unhandled Rejection Guard
// ==========================================
// Catches any unhandled promise rejections
// that escaped try/catch blocks — logs them
// instead of crashing the process silently
// ==========================================
process.on("unhandledRejection", (reason) => {
  logger.error("Server", "Unhandled Promise Rejection.", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Server", "Uncaught Exception.", err.message);
  process.exit(1); // Uncaught exceptions are always fatal
});

module.exports = app;