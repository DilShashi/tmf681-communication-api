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

// Load all MongoDB models to ensure they're registered with Mongoose
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
    socketTimeoutMS: 45000,
    maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    retryWrites: true,
    retryReads: true,
    authSource: 'admin'
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
      
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        logger.warn(`Retry ${retryCount}/${MAX_RETRIES}. Retrying in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connect();
      } else {
        logger.error('MongoDB connection failed after maximum retries');
        throw err;
      }
    }
  };

  try {
    await connect();
  } catch (err) {
    process.exit(1);
  }
};

// MongoDB event listeners
mongoose.connection.on('error', err => {
  logger.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection active');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// Initialize database connection
connectWithRetry();

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

// 404 Not Found handler
app.use((req, res, next) => {
  TMFErrorHandler.handleNotFound(req, res, next);
});

// Global error handler
app.use((err, req, res, next) => {
  TMFErrorHandler.handleError(err, req, res, next);
});

module.exports = app;
