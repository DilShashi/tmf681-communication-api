// railway-start.js
require('dotenv').config();
const logger = require('./src/utils/logger');
const app = require('./src/app'); // Now this just returns the app

const PORT = process.env.PORT || process.env.API_PORT || 8080;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown handlers...
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down...');
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB disconnected. Exiting.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down...');
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB disconnected. Exiting.');
      process.exit(0);
    });
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
