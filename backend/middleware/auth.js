// ==========================================
// middleware/auth.js
// ==========================================
// Express middleware that protects API routes
// by verifying Firebase Auth ID tokens sent
// from the Vue dashboard.
//
// How it works:
//   1. Vue dashboard logs in via Firebase Auth
//   2. Firebase returns an ID token (JWT)
//   3. Vue attaches token to every API request
//      in the Authorization header:
//      "Authorization: Bearer <token>"
//   4. This middleware intercepts the request,
//      verifies the token with Firebase Admin,
//      and either allows or rejects the request
//
// Protected routes will return 401 if no
// valid token is provided.
// ==========================================

const { getAdmin } = require("../config/firebase");
const logger       = require("../utils/logger");

// ==========================================
// verifyToken()
// ==========================================
// Main middleware function. Attach to any
// Express route that requires authentication.
//
// Usage in routes:
//   router.get("/status", verifyToken, handler)
//
// On success: attaches decoded user info
//   to req.user and calls next()
//
// On failure: returns 401 Unauthorized
// ==========================================
async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  // Check Authorization header exists
  if (!authHeader) {
    logger.warn("Auth", `No Authorization header — ${req.method} ${req.path}`);
    return res.status(401).json({
      success: false,
      error:   "Unauthorized — No token provided.",
    });
  }

  // Header must follow "Bearer <token>" format
  if (!authHeader.startsWith("Bearer ")) {
    logger.warn("Auth", "Malformed Authorization header.");
    return res.status(401).json({
      success: false,
      error:   "Unauthorized — Invalid token format. Use: Bearer <token>",
    });
  }

  // Extract the token string after "Bearer "
  const token = authHeader.split("Bearer ")[1];

  if (!token || token.trim() === "") {
    logger.warn("Auth", "Empty token in Authorization header.");
    return res.status(401).json({
      success: false,
      error:   "Unauthorized — Token is empty.",
    });
  }

  try {
    // Verify the token using Firebase Admin SDK
    // This checks:
    //   - Token signature is valid
    //   - Token has not expired
    //   - Token belongs to our Firebase project
    const admin       = getAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach decoded user info to the request
    // so route handlers can access user details
    req.user = {
      uid:   decodedToken.uid,
      email: decodedToken.email || null,
      name:  decodedToken.name  || null,
    };

    logger.debug("Auth", `Token verified for user: ${req.user.email || req.user.uid}`);

    // Pass control to the next middleware or route handler
    next();

  } catch (err) {
    // Token verification failed
    // Common causes:
    //   - Token expired (Firebase tokens last 1 hour)
    //   - Token was tampered with
    //   - Token belongs to a different project

    logger.warn("Auth", "Token verification failed.", err.message);

    return res.status(401).json({
      success: false,
      error:   "Unauthorized — Invalid or expired token.",
    });
  }
}

// ==========================================
// optionalAuth()
// ==========================================
// A softer version of verifyToken that does
// NOT reject requests without a token.
//
// If a valid token is present, it attaches
// req.user as usual. If no token or invalid
// token, it sets req.user to null and
// continues to the route handler.
//
// Useful for routes that show different data
// to authenticated vs unauthenticated users
// but don't outright block access.
// ==========================================
async function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split("Bearer ")[1];

  if (!token || token.trim() === "") {
    req.user = null;
    return next();
  }

  try {
    const admin        = getAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid:   decodedToken.uid,
      email: decodedToken.email || null,
      name:  decodedToken.name  || null,
    };

    logger.debug("Auth", `Optional auth: user identified as ${req.user.email || req.user.uid}`);

  } catch {
    // Token invalid — treat as unauthenticated
    req.user = null;
    logger.debug("Auth", "Optional auth: invalid token, proceeding as unauthenticated.");
  }

  next();
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  verifyToken,
  optionalAuth,
};