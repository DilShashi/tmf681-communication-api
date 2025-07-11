// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Start the server with Railway-specific configuration
const startApplication = async () => {
  try {
    // Railway-specific configuration
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.PORT = process.env.PORT || '8080';
    
    logger.info('Starting application with Railway configuration...');
    const server = await startServer();
    
    // Railway-specific event listeners
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM. Preparing for shutdown...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (err) {
    logger.error('Failed to start application:', err);
    process.exit(1);
  }
};

startApplication().catch(err => {
  logger.error('Application failed:', err);
  process.exit(1);
});

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});