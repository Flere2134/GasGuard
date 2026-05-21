// ==========================================
// config/mqtt.js
// ==========================================
// Initializes and manages the MQTT client
// connection for the GasGuard backend.
//
// This module:
//   - Connects to the MQTT broker
//   - Subscribes to ESP32 telemetry topics
//   - Routes incoming messages to the
//     appropriate service handlers
//   - Provides a publish function for
//     sending override commands to ESP32
//   - Handles reconnection automatically
// ==========================================

const mqtt   = require("mqtt");
const logger = require("../utils/logger");

// ==========================================
// Internal State
// ==========================================
let client      = null;
let isConnected = false;

// Message handler callbacks registered by
// services that need to react to MQTT messages
// Key: topic string
// Value: handler function(topic, payload)
const messageHandlers = {};

// ==========================================
// MQTT Topics to Subscribe
// ==========================================
// The backend listens to these two topics
// published by the ESP32 firmware
// ==========================================
const SUBSCRIBE_TOPICS = [
  "gasguard/telemetry",  // Sensor data every 2 seconds
  "gasguard/alert",      // Alert events on state transitions
];

// ==========================================
// initMQTT()
// ==========================================
// Creates an MQTT client and connects to
// the broker using credentials from .env
//
// Connection options:
//   clientId  — unique ID for this backend
//   username  — optional broker auth
//   password  — optional broker auth
//   keepalive — heartbeat interval (60s)
//   reconnectPeriod — auto reconnect (5s)
//   connectTimeout  — connection timeout (10s)
//
// Called once at server startup in server.js
// ==========================================
function initMQTT() {
  const brokerUrl = process.env.MQTT_BROKER;
  const port      = parseInt(process.env.MQTT_PORT) || 1883;

  if (!brokerUrl) {
    logger.error("MQTT", "MQTT_BROKER is not set in .env");
    throw new Error("MQTT_BROKER environment variable is required.");
  }

  const options = {
    clientId:        `gasguard-backend-${Math.random().toString(16).slice(2, 8)}`,
    port:            port,
    keepalive:       60,
    reconnectPeriod: 5000,   // Retry every 5 seconds if disconnected
    connectTimeout:  10000,  // Give up connecting after 10 seconds
    clean:           true,   // Start fresh session each connect
  };

  // Add credentials if provided in .env
  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
    options.password = process.env.MQTT_PASSWORD;
  }

  logger.info("MQTT", `Connecting to broker: ${brokerUrl}:${port}`);
  logger.info("MQTT", `Client ID: ${options.clientId}`);

  // Create and connect the MQTT client
  client = mqtt.connect(brokerUrl, options);

  // ----------------------------------------
  // Event: connect
  // ----------------------------------------
  // Fires when the client successfully
  // connects or reconnects to the broker.
  // Subscribe to ESP32 topics here so
  // subscriptions are restored on reconnect.
  // ----------------------------------------
  client.on("connect", () => {
    isConnected = true;
    logger.info("MQTT", "Connected to broker successfully.");

    // Subscribe to all ESP32 publish topics
    SUBSCRIBE_TOPICS.forEach((topic) => {
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error("MQTT", `Failed to subscribe to: ${topic}`, err.message);
        } else {
          logger.info("MQTT", `Subscribed to: ${topic}`);
        }
      });
    });
  });

  // ----------------------------------------
  // Event: message
  // ----------------------------------------
  // Fires whenever a message arrives on
  // any subscribed topic.
  // Routes the message to the correct
  // registered handler function.
  // ----------------------------------------
  client.on("message", (topic, payloadBuffer) => {
    const raw = payloadBuffer.toString();

    logger.debug("MQTT", `Message received on: ${topic}`, raw);

    // Parse JSON payload
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      logger.warn("MQTT", `Failed to parse JSON on topic: ${topic}`, raw);
      return;
    }

    // Route to registered handler if one exists
    if (messageHandlers[topic]) {
      messageHandlers[topic](topic, payload);
    } else {
      logger.warn("MQTT", `No handler registered for topic: ${topic}`);
    }
  });

  // ----------------------------------------
  // Event: reconnect
  // ----------------------------------------
  // Fires each time the client attempts
  // to reconnect after a dropped connection
  // ----------------------------------------
  client.on("reconnect", () => {
    isConnected = false;
    logger.warn("MQTT", "Connection lost. Attempting to reconnect...");
  });

  // ----------------------------------------
  // Event: offline
  // ----------------------------------------
  // Fires when the client goes offline
  // ----------------------------------------
  client.on("offline", () => {
    isConnected = false;
    logger.warn("MQTT", "Client is offline.");
  });

  // ----------------------------------------
  // Event: error
  // ----------------------------------------
  // Fires on connection or protocol errors
  // ----------------------------------------
  client.on("error", (err) => {
    isConnected = false;
    logger.error("MQTT", "Client error.", err.message);
  });

  // ----------------------------------------
  // Event: close
  // ----------------------------------------
  // Fires when the connection is closed
  // ----------------------------------------
  client.on("close", () => {
    isConnected = false;
    logger.warn("MQTT", "Connection closed.");
  });
}

// ==========================================
// registerHandler()
// ==========================================
// Registers a callback function to handle
// incoming messages on a specific topic.
//
// Called by services during their init:
//
//   registerHandler(
//     "gasguard/telemetry",
//     telemetryService.handleTelemetry
//   );
//
// Only one handler per topic is supported.
// ==========================================
function registerHandler(topic, handler) {
  if (typeof handler !== "function") {
    logger.error("MQTT", `Handler for ${topic} is not a function.`);
    return;
  }

  messageHandlers[topic] = handler;
  logger.debug("MQTT", `Handler registered for topic: ${topic}`);
}

// ==========================================
// publish()
// ==========================================
// Publishes a message to a given MQTT topic.
// Used by overrideService to send commands
// to the ESP32 firmware.
//
// Parameters:
//   topic   — the MQTT topic string
//   payload — object that will be JSON stringified
//   retain  — if true, broker stores last message
//
// Example:
//   publish("gasguard/command/valve", { state: "CLOSE" })
// ==========================================
function publish(topic, payload, retain = false) {
  if (!client || !isConnected) {
    logger.error("MQTT", `Cannot publish to ${topic} — not connected.`);
    return false;
  }

  const message = JSON.stringify(payload);

  client.publish(topic, message, { qos: 1, retain }, (err) => {
    if (err) {
      logger.error("MQTT", `Failed to publish to ${topic}`, err.message);
    } else {
      logger.info("MQTT", `Published to ${topic}`, message);
    }
  });

  return true;
}

// ==========================================
// isMQTTConnected()
// ==========================================
// Returns true if the MQTT client is
// currently connected to the broker.
// Used by routes to check connection
// status before attempting operations.
// ==========================================
function isMQTTConnected() {
  return isConnected && client !== null;
}

// ==========================================
// getClient()
// ==========================================
// Returns the raw MQTT client instance.
// Only used when direct client access
// is needed beyond what this module provides.
// ==========================================
function getClient() {
  return client;
}

// ==========================================
// Module Exports
// ==========================================
module.exports = {
  initMQTT,
  registerHandler,
  publish,
  isMQTTConnected,
  getClient,
};