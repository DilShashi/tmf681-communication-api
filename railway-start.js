// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Enhanced Railway startup sequence
const startApplication = async () => {
  try {
    // Railway-specific configuration
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.PORT = process.env.PORT || '8080';

    logger.info('🚂 Starting Railway-optimized application...');
    logger.info(`Service: ${process.env.RAILWAY_SERVICE_NAME || 'communication-service'}`);
    logger.info(`Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'production'}`);

    const server = await startServer();

    // Railway-specific event listeners
    if (process.env.RAILWAY_ENVIRONMENT_ID) {
      process.on('beforeExit', (code) => {
        logger.info(`Application exiting with code ${code}`);
      });

      server.on('close', () => {
        logger.info('Server instance closed (Railway)');
      });
    }

    return server;
  } catch (err) {
    logger.error('Railway application failed to start:', err);
    process.exit(1);
  }
};

// Start application with enhanced error handling
startApplication().catch(err => {
  logger.error('Application startup failed:', err);
  process.exit(1);
});

// Global error handlers remain unchanged
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});