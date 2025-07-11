// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Railway-specific startup
const startApplication = async () => {
  try {
    // Ensure required Railway variables are set
    if (!process.env.PORT) {
      process.env.PORT = '8080';
    }
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }

    logger.info('Starting Railway application...');
    logger.info(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'Not detected'}`);
    
    const server = await startServer();
    
    // Additional Railway health checks
    server.on('listening', () => {
      logger.info('Application ready for requests');
    });
    
    return server;
  } catch (err) {
    logger.error('Failed to start Railway application:', err);
    process.exit(1);
  }
};

// Start with error handling
startApplication().catch(err => {
  logger.error('Application startup failed:', err);
  process.exit(1);
});

// Global error handlers remain the same
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});