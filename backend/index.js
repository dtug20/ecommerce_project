require("dotenv").config();
const express = require("express");
const app = express();
const path = require('path');
const cors = require("cors");
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

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

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
  jwksRequestsPerMinute: 5,
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

// root route
app.get("/", (req, res) => res.send("Apps worked successfully"));

server.listen(PORT, () => console.log(`server running on port ${PORT}`));

// global error handler
app.use(globalErrorHandler);
//* handle not found
app.use((req, res, next) => {
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
  next();
});

module.exports = app;
