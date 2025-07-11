// src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('./config/tmf-config');
const logger = require('./utils/logger');
const TMFErrorHandler = require('./utils/tmfErrorHandler');

// Load all MongoDB models
const loadModels = () => {
  require('./models/CommunicationMessage');
  require('./models/Attachment');
  require('./models/Characteristic');
  require('./models/CharacteristicRelationship');
  require('./models/Receiver');
  require('./models/Sender');
  require('./models/Event');
  require('./models/Quantity');
  require('./models/RelatedParty');
};
loadModels();

const isRailway = process.env.RAILWAY_ENVIRONMENT_ID !== undefined;

// Import route handlers
const communicationRoutes = require('./routes/communicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hubRoutes = require('./routes/hubRoutes');
const clientRoutes = require('./routes/clientRoutes');

// Initialize Express application
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tmf681-communication-api.up.railway.app'] 
    : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', { 
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// MongoDB connection with retry logic
const connectWithRetry = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000;
  let retryCount = 0;

  const getMongoOptions = () => ({
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    retryWrites: true,
    retryReads: true,
    authSource: 'admin',
    connectTimeoutMS: 10000
  });

  const connect = async () => {
    try {
      const mongoUrl = process.env.DB_URL || config.database.url;
      logger.info(`Connecting to MongoDB at ${mongoUrl.replace(/:[^:]*@/, ':***@')}`);
      
      await mongoose.connect(mongoUrl, getMongoOptions());
      
      logger.info('MongoDB connection established');
      return true;
    } catch (err) {
      logger.error(`MongoDB connection error: ${err.message}`);
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        logger.warn(`Retry ${retryCount}/${MAX_RETRIES}. Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connect();
      }
      throw err;
    }
  };

  return connect();
};

// MongoDB event listeners
mongoose.connection.on('error', err => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection active');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost');
});

// Add this before the API routes
app.get(`${config.api.basePath}/`, (req, res) => {
  res.redirect(`${config.api.basePath}/communicationMessage`);
});

// API routes
app.use(`${config.api.basePath}/communicationMessage`, communicationRoutes);
app.use(`${config.api.basePath}/notification`, notificationRoutes);
app.use(`${config.api.basePath}/hub`, hubRoutes);
app.use(`${config.api.basePath}/listener`, clientRoutes);

// Health check endpoint
app.get(`${config.api.basePath}/health`, (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  res.status(200).json({ 
    status: 'UP',
    database: dbStatus,
    version: config.api.version,
    environment: process.env.NODE_ENV || 'development',
    baseUrl: config.api.baseUrl,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API documentation redirect
app.get(`${config.api.basePath}/api-docs`, (req, res) => {
  res.redirect('https://www.tmforum.org/resources/specification/tmf681-communication-management-api-v4-0-0/');
});

// Railway-specific endpoint
app.get('/railway', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: process.env.RAILWAY_SERVICE_NAME,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME
  });
});

// 404 Not Found handler
app.use((req, res, next) => {
  TMFErrorHandler.handleNotFound(req, res, next);
});

// Global error handler
app.use((err, req, res, next) => {
  TMFErrorHandler.handleError(err, req, res, next);
});

// Start server function
const startServer = async () => {
  try {
    await connectWithRetry();
    
    const PORT = parseInt(process.env.PORT || process.env.API_PORT || 8080, 10);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`API base path: ${config.api.basePath}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (isRailway) {
        logger.info('Running in Railway environment');
      }
    });

    // Railway-optimized shutdown handler
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, initiating immediate shutdown...`);
      
      // Immediate server close
      server.close(() => {
        logger.info('Server closed');
      });
      
      // Force MongoDB disconnect
      mongoose.connection.close(false)
        .then(() => logger.info('MongoDB connection closed'))
        .catch(err => logger.error('Error closing MongoDB:', err))
        .finally(() => process.exit(0));
    };

    // Simplified signal handling for Railway
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

module.exports = {
  app,
  startServer
};