// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Enhanced Railway startup
const startApplication = async () => {
  try {
    // Railway-specific configuration
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.PORT = process.env.PORT || '8080';
    
    logger.info('Starting Railway application with enhanced configuration...');
    logger.info(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'production'}`);
    logger.info(`Service Name: ${process.env.RAILWAY_SERVICE_NAME || 'communication-service'}`);
    
    const server = await startServer();
    
    // Additional Railway event listeners
    server.on('close', () => {
      logger.info('Server instance closed');
    });
    
    return server;
  } catch (err) {
    logger.error('Railway application failed to start:', err);
    process.exit(1);
  }
};

// Start with enhanced error handling
startApplication().catch(err => {
  logger.error('Application startup failed:', err);
  process.exit(1);
});

// Keep global error handlers
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});