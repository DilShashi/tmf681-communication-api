// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Start the server with enhanced error handling
const startApplication = async () => {
  try {
    const server = await startServer();
    
    // Additional server event listeners
    server.on('error', (err) => {
      logger.error('Server error:', err);
    });
    
    server.on('close', () => {
      logger.info('Server closed');
    });
  } catch (err) {
    logger.error('Failed to start application:', err);
    process.exit(1);
  }
};

startApplication();

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});