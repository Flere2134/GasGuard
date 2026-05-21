// ==========================================
// middleware/errorHandler.js
// ==========================================
// Centralized Express error handling
// middleware for the GasGuard backend.
//
// Catches all errors thrown or passed via
// next(err) from any route or middleware,
// formats them into consistent JSON responses,
// and logs them appropriately.
//
// Must be registered LAST in server.js
// after all routes, as Express identifies
// error handlers by their 4-parameter
// signature: (err, req, res, next)
// ==========================================

const logger = require("../utils/logger");

// ==========================================
// HTTP Status Code Map
// ==========================================
// Maps common error names or types to their
// appropriate HTTP status codes so responses
// are semantically correct.
// ==========================================
const ERROR_STATUS_MAP = {
  ValidationError:   400,  // Bad request — invalid input
  UnauthorizedError: 401,  // Auth required
  ForbiddenError:    403,  // Auth valid but access denied
  NotFoundError:     404,  // Resource not found
  ConflictError:     409,  // State conflict
  TimeoutError:      408,  // Request timed out
};

// ==========================================
// notFound()
// ==========================================
// Handles requests to routes that do not
// exist — generates a clean 404 response.
//
// Register this BEFORE errorHandler in
// server.js to catch undefined routes:
//
//   app.use(notFound);
//   app.use(errorHandler);
// ==========================================
function notFound(req, res, next) {
  logger.warn("API", `Route not found: ${req.method} ${req.originalUrl}`);

  const err    = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status   = 404;
  err.name     = "NotFoundError";

  next(err);
}

// ==========================================
// errorHandler()
// ==========================================
// Main error handling middleware.
// Catches all errors from routes and
// returns a structured JSON error response.
//
// Response format:
// {
//   "success"   : false,
//   "error"     : "Human readable message",
//   "code"      : "ErrorName",
//   "path"      : "/api/status",
//   "timestamp" : "2024-01-15T14:32:05.000Z"
// }
// ==========================================
function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  // Determine HTTP status code
  // Priority: err.status → mapped by name → default 500
  const statusCode =
    err.status ||
    ERROR_STATUS_MAP[err.name] ||
    500;

  // Determine if this is a server-side fault
  const isServerError = statusCode >= 500;

  // Log appropriately based on severity
  if (isServerError) {
    logger.error("API", `${statusCode} ${req.method} ${req.originalUrl}`, {
      message: err.message,
      stack:   process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  } else {
    logger.warn("API", `${statusCode} ${req.method} ${req.originalUrl}`, {
      message: err.message,
    });
  }

  // Build the error response
  const response = {
    success:   false,
    error:     err.message || "An unexpected error occurred.",
    code:      err.name    || "InternalServerError",
    path:      req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development only
  // Never expose stack traces in production
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  notFound,
  errorHandler,
};