const config = require('./config.json');
const logger = require('../utils/logger');

// Validate configuration
const validateConfig = () => {
  const requiredFields = [
    'api.baseUrl',
    'api.basePath',
    'database.url',
    'logging.level'
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], config);
    if (!value) {
      logger.error(`Missing required configuration field: ${field}`);
      process.exit(1);
    }
  }

  if (!config.database.url.startsWith('mongodb://')) {
    logger.error('Invalid database URL format');
    process.exit(1);
  }
};

// Initialize configuration
const initConfig = () => {
  validateConfig();
  
  // Set defaults
  config.api.port = config.api.port || 8080;
  config.logging.level = config.logging.level || 'info';
  config.retry = config.retry || {};
  config.retry.maxRetries = config.retry.maxRetries || 3;
  config.retry.initialDelay = config.retry.initialDelay || 1000;
  config.retry.delayMultiplier = config.retry.delayMultiplier || 2;
  
  return config;
};

module.exports = initConfig();
