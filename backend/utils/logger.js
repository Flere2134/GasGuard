// ==========================================
// logger.js
// ==========================================
// Centralized logging utility for GasGuard
// backend. Provides structured, color-coded,
// timestamped log output to the console and
// optionally to a log file.
//
// Log levels (in order of severity):
//   INFO  — general system events
//   WARN  — non-critical issues
//   ERROR — failures that need attention
//   DEBUG — detailed data for development
//           (disabled in production)
// ==========================================

const fs   = require("fs");
const path = require("path");

// ==========================================
// Configuration
// ==========================================
const LOG_TO_FILE   = process.env.LOG_TO_FILE === "true";
const LOG_LEVEL     = process.env.LOG_LEVEL || "debug"; // info | warn | error | debug
const LOG_FILE_PATH = path.join(__dirname, "../../logs/gasguard.log");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ==========================================
// ANSI Color Codes
// ==========================================
// Used to color-code log output in the
// terminal for quick visual scanning.
// Colors are stripped in log files.
// ==========================================
const COLORS = {
  reset:  "\x1b[0m",
  dim:    "\x1b[2m",
  info:   "\x1b[36m",   // Cyan
  warn:   "\x1b[33m",   // Yellow
  error:  "\x1b[31m",   // Red
  debug:  "\x1b[35m",   // Magenta
  time:   "\x1b[90m",   // Gray
  label:  "\x1b[1m",    // Bold
};

// ==========================================
// Level Priority Map
// ==========================================
// Controls which levels are actually printed.
// Setting LOG_LEVEL to "warn" suppresses
// info and debug messages.
// ==========================================
const LEVEL_PRIORITY = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

// ==========================================
// getTimestamp()
// ==========================================
// Returns the current date and time as a
// formatted string for log prefixes.
// Format: YYYY-MM-DD HH:MM:SS
// ==========================================
function getTimestamp() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  return `${date} ${time}`;
}

// ==========================================
// shouldLog()
// ==========================================
// Returns true if the given level meets
// or exceeds the configured LOG_LEVEL.
// ==========================================
function shouldLog(level) {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}

// ==========================================
// writeToFile()
// ==========================================
// Appends a plain text log entry to the
// log file if LOG_TO_FILE is enabled.
// Strips ANSI color codes for clean files.
// Creates the logs/ directory if it doesn't
// exist yet.
// ==========================================
function writeToFile(entry) {
  if (!LOG_TO_FILE) return;

  try {
    // Ensure logs directory exists
    const logDir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Strip ANSI codes for clean file output
    const plainEntry = entry.replace(/\x1b\[[0-9;]*m/g, "");
    fs.appendFileSync(LOG_FILE_PATH, plainEntry + "\n", "utf8");
  } catch (err) {
    console.error("[LOGGER] Failed to write to log file:", err.message);
  }
}

// ==========================================
// formatMessage()
// ==========================================
// Builds the full log line with timestamp,
// level badge, module tag, and message.
//
// Console output format:
//   2024-01-15 14:32:05 [INFO]  [MQTT] Connected to broker
//
// With colors applied per level.
// ==========================================
function formatMessage(level, module, message, data) {
  const timestamp = getTimestamp();
  const levelUpper = level.toUpperCase().padEnd(5);
  const moduleTag = module ? `[${module}]` : "";

  // Format optional data object
  let dataStr = "";
  if (data !== undefined) {
    if (typeof data === "object") {
      dataStr = "\n  " + JSON.stringify(data, null, 2)
        .split("\n")
        .join("\n  ");
    } else {
      dataStr = ` — ${data}`;
    }
  }

  // Colored console version
  const colored =
    `${COLORS.time}${timestamp}${COLORS.reset} ` +
    `${COLORS[level]}${COLORS.label}[${levelUpper}]${COLORS.reset} ` +
    `${COLORS.dim}${moduleTag}${COLORS.reset} ` +
    `${message}` +
    `${COLORS.dim}${dataStr}${COLORS.reset}`;

  // Plain version for file
  const plain =
    `${timestamp} [${levelUpper}] ${moduleTag} ${message}${dataStr}`;

  return { colored, plain };
}

// ==========================================
// Core Log Functions
// ==========================================
// Each function accepts:
//   module  — the source file/service name
//             e.g. "MQTT", "Firebase", "API"
//   message — the log message string
//   data    — optional object or value for
//             additional context
// ==========================================

function info(module, message, data) {
  if (!shouldLog("info")) return;
  const { colored, plain } = formatMessage("info", module, message, data);
  console.log(colored);
  writeToFile(plain);
}

function warn(module, message, data) {
  if (!shouldLog("warn")) return;
  const { colored, plain } = formatMessage("warn", module, message, data);
  console.warn(colored);
  writeToFile(plain);
}

function error(module, message, data) {
  if (!shouldLog("error")) return;
  const { colored, plain } = formatMessage("error", module, message, data);
  console.error(colored);
  writeToFile(plain);
}

function debug(module, message, data) {
  if (!shouldLog("debug") || IS_PRODUCTION) return;
  const { colored, plain } = formatMessage("debug", module, message, data);
  console.log(colored);
  writeToFile(plain);
}

// ==========================================
// separator()
// ==========================================
// Prints a visual divider line to the console.
// Useful for marking startup sections or
// separating log groups for readability.
// ==========================================
function separator(label = "") {
  const line = "─".repeat(50);
  const output = label
    ? `${COLORS.dim}┌${line}┐${COLORS.reset}\n` +
      `${COLORS.dim}│ ${COLORS.label}${label.padEnd(49)}${COLORS.dim}│${COLORS.reset}\n` +
      `${COLORS.dim}└${line}┘${COLORS.reset}`
    : `${COLORS.dim}${line}${COLORS.reset}`;

  console.log(output);
  writeToFile(label ? `\n--- ${label} ---` : "\n---");
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  info,
  warn,
  error,
  debug,
  separator,
};