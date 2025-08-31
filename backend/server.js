const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const borrowRoutes = require('./routes/borrow');

const app = express();

// Middleware
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://192.168.254.12:5173',
      'http://192.168.254.12:19006',
      'http://192.168.254.12:8081',
      'http://192.168.254.12:8082',
      'http://192.168.254.12:8083',
      'https://tanuzalms.netlify.app',
      'https://expo.dev',
      'https://u.expo.dev',
      'https://expo.io',
      'exp://localhost:19000',
      'exp://localhost:19006',
      'exp://127.0.0.1:19000',
      'exp://127.0.0.1:19006'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow common localhost variants and Expo packager proxies
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const isExpoDev = /^https?:\/\/.*\.expo\.dev$/.test(origin || '');
    const isExpoLocal = /^exp:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    
    if (isLocalhost || isExpoDev || isExpoLocal || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
// (Removed verbose request logging middleware)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    process.exit(1);
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    const Book = require('./models/Book');
    const User = require('./models/User');
    const Borrow = require('./models/Borrow');

    // Create text indexes for search functionality
    await Book.createIndexes();
    await User.createIndexes();
    await Borrow.createIndexes();

  } catch (error) {
  // silently ignore index creation logging
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
  // server started
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  process.exit(1);
});

startServer();
