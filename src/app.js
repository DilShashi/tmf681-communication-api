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

// Enhanced model pre-loading (unchanged)
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

// Import routes (unchanged)
const communicationRoutes = require('./routes/communicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hubRoutes = require('./routes/hubRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();

// Middleware (unchanged)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Enhanced MongoDB connection with proper authentication handling
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
    auth: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    authSource: 'admin' // Important for Railway MongoDB
  });

  const connect = async () => {
    try {
      const mongoUrl = process.env.DB_URL || config.database.url;
      logger.info(`Attempting to connect to MongoDB at ${mongoUrl.replace(/:[^:]*@/, ':***@')}`);
      
      await mongoose.connect(mongoUrl, getMongoOptions());
      
      logger.info('Connected to MongoDB successfully');
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

// Event listeners (unchanged)
mongoose.connection.on('error', err => {
  logger.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// Initialize connection
connectWithRetry();

// API routes (unchanged)
app.use(`${config.api.basePath}/communicationMessage`, communicationRoutes);
app.use(`${config.api.basePath}/notification`, notificationRoutes);
app.use(`${config.api.basePath}/hub`, hubRoutes);
app.use(`${config.api.basePath}/listener`, clientRoutes);

// Health check (unchanged)
app.get(`${config.api.basePath}/health`, (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  res.status(200).json({ 
    status: 'UP',
    database: dbStatus,
    version: config.api.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling (unchanged)
app.use((req, res, next) => {
  TMFErrorHandler.handleNotFound(req, res, next);
});

app.use((err, req, res, next) => {
  TMFErrorHandler.handleError(err, req, res, next);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || config.api.port || 8080;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API base path: ${config.api.basePath}`);
});

server.on('error', (err) => {
  logger.error('Server error:', err);
  process.exit(1);
});

module.exports = app;