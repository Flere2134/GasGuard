// ==========================================
// routes/overrides.js
// ==========================================
// Handles manual override commands sent
// from the Vue dashboard to control the
// ESP32 actuators remotely.
//
// Endpoints:
//   POST /api/overrides        — send a command
//   GET  /api/overrides/history — override log
// ==========================================

const express                                   = require("express");
const router                                    = express.Router();
const { sendOverride, getOverrideHistory }      = require("../services/overrideService");
const { verifyToken }                           = require("../middleware/auth");
const logger                                    = require("../utils/logger");

// ==========================================
// POST /api/overrides
// ==========================================
// Sends a manual override command to the
// ESP32 via MQTT.
//
// Request body:
// {
//   "device" : "fan",    // "fan" or "valve"
//   "state"  : "ON"      // see valid states below
// }
//
// Valid combinations:
//   fan   + ON    → turn exhaust fan on
//   fan   + OFF   → turn exhaust fan off
//   valve + OPEN  → open the gas valve
//   valve + CLOSE → close the gas valve
//
// Response (200 OK):
// {
//   "success" : true,
//   "message" : "Override sent: fan → ON",
//   "record"  : {
//     "device"    : "fan",
//     "state"     : "ON",
//     "issuedBy"  : "user@email.com",
//     "timestamp" : "2024-01-15T14:32:05.000Z"
//   }
// }
//
// Response (400 Bad Request):
// {
//   "success" : false,
//   "error"   : "Invalid state \"STOP\" for device \"fan\""
// }
// ==========================================
router.post("/", verifyToken, async (req, res, next) => {
  const { device, state } = req.body;
  const issuedBy = req.user.email || req.user.uid;

  logger.info("Route:Overrides",
    `POST /api/overrides — device: ${device} | state: ${state} | by: ${issuedBy}`
  );

  // Validate request body fields exist
  if (!device || !state) {
    return res.status(400).json({
      success : false,
      error   : "Request body must include both 'device' and 'state' fields.",
    });
  }

  try {
    const result = await sendOverride(
      device.toLowerCase(),
      state.toUpperCase(),
      issuedBy
    );

    if (!result.success) {
      return res.status(400).json({
        success : false,
        error   : result.message,
      });
    }

    return res.status(200).json({
      success : true,
      message : result.message,
      record  : result.record,
    });

  } catch (err) {
    next(err);
  }
});

// ==========================================
// GET /api/overrides/history
// ==========================================
// Returns the in-memory log of the last
// 20 override commands issued from
// the dashboard.
//
// Useful for the dashboard audit log panel
// showing who issued what command and when.
//
// Response (200 OK):
// {
//   "success" : true,
//   "count"   : 5,
//   "data"    : [
//     {
//       "device"    : "valve",
//       "state"     : "CLOSE",
//       "issuedBy"  : "user@email.com",
//       "topic"     : "gasguard/command/valve",
//       "timestamp" : "2024-01-15T14:32:05.000Z",
//       "success"   : true
//     },
//     ...
//   ]
// }
// ==========================================
router.get("/history", verifyToken, (req, res) => {
  logger.debug("Route:Overrides",
    `GET /api/overrides/history — user: ${req.user.email || req.user.uid}`
  );

  const history = getOverrideHistory();

  return res.status(200).json({
    success : true,
    count   : history.length,
    data    : history,
  });
});

module.exports = router;