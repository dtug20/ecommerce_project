require("dotenv").config();
const express = require("express");
const app = express();
const path = require('path');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require("./config/db");
const { secret } = require("./config/secret");
const PORT = process.env.PORT || secret.port || 7001;
const morgan = require('morgan')
// error handler
const globalErrorHandler = require("./middleware/global-error-handler");
// routes — v1 (canonical) and legacy aliases
const v1Routes      = require("./routes/v1");
const legacyAliases = require("./routes/legacy-aliases");

// middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8081',
  secret.client_url,
  secret.admin_url,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Health check — liveness probe (no auth, outside rate limiter)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", error: "Too many requests, please try again later" },
});
app.use(globalLimiter);

// Stricter rate limit for payment and order creation
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "fail", error: "Too many payment attempts, please try again later" },
});
app.use("/api/order/create-payment-intent", paymentLimiter);
app.use("/api/order/saveOrder", paymentLimiter);

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Store io instance globally for use in controllers
global.io = io;

// Socket.io authentication middleware (Keycloak JWT)
const jwksRsa = require("jwks-rsa");
const jwt = require("jsonwebtoken");
const { keycloakConfig } = require("./config/keycloak");

const socketJwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 30,
  jwksUri: keycloakConfig.jwksUri,
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    // Allow anonymous connections for public events
    socket.user = null;
    return next();
  }
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return next(new Error("Authentication error"));
    const key = await socketJwksClient.getSigningKey(decoded.header.kid);
    const verified = jwt.verify(token, key.getPublicKey(), {
      algorithms: ["RS256"],
      issuer: keycloakConfig.authority,
    });
    socket.user = {
      keycloakId: verified.sub,
      email: verified.email,
      name: verified.preferred_username || verified.name,
      roles: verified.realm_access?.roles || [],
    };
    next();
  } catch (err) {
    console.error("[Socket.io] Auth error:", err.message);
    next(new Error("Authentication error"));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, socket.user ? `(${socket.user.email})` : '(anonymous)');

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// connect database
connectDB();

// v1 — canonical versioned API
app.use("/api/v1", v1Routes);

// Legacy routes — preserved for backward compatibility with Deprecation headers
// All original /api/* paths continue to work until the 2026-08-01 sunset date.
app.use("/api", legacyAliases);

// root route
app.get("/", (req, res) => res.send("Apps worked successfully"));

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API Not Found',
      },
    ],
  });
});

// global error handler (must be last middleware)
app.use(globalErrorHandler);

server.listen(PORT, () => console.log(`server running on port ${PORT}`));

module.exports = app;
