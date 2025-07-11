// railway-start.js
require('dotenv').config();
const { startServer } = require('./src/app');
const logger = require('./src/utils/logger');

// Minimal Railway startup
(async () => {
  try {
    // Set Railway defaults
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.PORT = process.env.PORT || '8080';
    
    logger.info('Starting Railway-optimized service...');
    await startServer();
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
})();

// Basic error handlers
process.on('uncaughtException', (err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});