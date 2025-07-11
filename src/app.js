require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('./config/tmf-config');
const logger = require('./utils/logger');
const TMFErrorHandler = require('./utils/tmfErrorHandler');

// Load models
require('./models/CommunicationMessage');
require('./models/Attachment');
require('./models/Characteristic');
require('./models/CharacteristicRelationship');
require('./models/Receiver');
require('./models/Sender');
require('./models/Event');
require('./models/Quantity');
require('./models/RelatedParty');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://tmf681-communication-api.up.railway.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Database connection with retry
const connectWithRetry = async () => {
  const mongoOptions = {
    // ❌ Do NOT use TLS (this was the problem)
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  try {
    const mongoUrl = process.env.MONGO_URL || config.database.url;
    logger.info(`Attempting MongoDB connection to ${mongoUrl}`);
    await mongoose.connect(mongoUrl, mongoOptions);
    logger.info('Connected to MongoDB successfully');

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Routes
app.use(`${config.api.basePath}/communicationMessage`, require('./routes/communicationRoutes'));
app.use(`${config.api.basePath}/notification`, require('./routes/notificationRoutes'));
app.use(`${config.api.basePath}/hub`, require('./routes/hubRoutes'));
app.use(`${config.api.basePath}/listener`, require('./routes/clientRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'TMF681 Communication API is running',
    version: config.api.version,
    baseUrl: config.api.baseUrl,
    endpoints: {
      messages: `${config.api.baseUrl}${config.api.basePath}/communicationMessage`,
      hub: `${config.api.baseUrl}${config.api.basePath}/hub`,
      health: `${config.api.baseUrl}${config.api.basePath}/health`
    }
  });
});

// Health check
app.get(`${config.api.basePath}/health`, (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(TMFErrorHandler.handleNotFound);
app.use(TMFErrorHandler.handleError);

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
