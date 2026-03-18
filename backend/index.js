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
// routes
const userRoutes = require("./routes/user.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const userOrderRoutes = require("./routes/user.order.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const couponRoutes = require("./routes/coupon.routes");
const reviewRoutes = require("./routes/review.routes");
const adminRoutes = require("./routes/admin.routes");
// const uploadRouter = require('./routes/uploadFile.route');
const cloudinaryRoutes = require("./routes/cloudinary.routes");
// admin CRUD routes (for CRM proxy)
const adminProductRoutes = require("./routes/admin.product.routes");
const adminCategoryRoutes = require("./routes/admin.category.routes");
const adminOrderRoutes = require("./routes/admin.order.routes");
const adminUserRoutes = require("./routes/admin.user.routes");

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

app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/product", productRoutes);
// app.use('/api/upload',uploadRouter);
app.use("/api/order", orderRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/user-order", userOrderRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);

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
