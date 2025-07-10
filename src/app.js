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

// Enhanced model pre-loading
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

// Import routes
const communicationRoutes = require('./routes/communicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const hubRoutes = require('./routes/hubRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Enhanced database connection
const connectWithRetry = async () => {
  mongoose.connection.on('error', err => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on('connected', () => {
    logger.info('Connected to MongoDB successfully');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  try {
    logger.info('Attempting MongoDB connection...');
    await mongoose.connect(config.database.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    mongoose.set('debug', process.env.NODE_ENV === 'development');
    mongoose.set('returnOriginal', false);
    mongoose.set('autoIndex', true);

    const PORT = process.env.PORT || config.api.port || 8080;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API base path: ${config.api.basePath}`);
    });

    server.on('error', (err) => {
      logger.error('Server error:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('MongoDB initial connection error:', err.message);
    logger.info('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// API routes - Updated listener route path to match specification
app.use(`${config.api.basePath}/communicationMessage`, communicationRoutes);
app.use(`${config.api.basePath}/notification`, notificationRoutes);
app.use(`${config.api.basePath}/hub`, hubRoutes);
app.use(`${config.api.basePath}/listener`, clientRoutes); // This line remains the same

// Health check endpoint
app.get(`${config.api.basePath}/health`, (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  res.status(200).json({ 
    status: 'UP',
    database: dbStatus
  });
});

// API documentation endpoint
app.get(`${config.api.basePath}/api-docs`, (req, res) => {
  res.redirect('https://www.tmforum.org/resources/specification/tmf681-communication-management-api-v4-0-0/');
});

// Error handling
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

module.exports = app;