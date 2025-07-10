const logger = require('./logger');
const { STATUS_CODES } = require('http');

class TMFErrorHandler {
  // TM Forum standard error format
  static createTMFError(statusCode, message, details = []) {
    const errorResponse = {
      code: statusCode,
      reason: STATUS_CODES[statusCode] || 'Unknown Error',
      message: message,
      status: statusCode.toString(),
      referenceError: null,
      details: details,
      '@baseType': 'Error',
      '@schemaLocation': 'http://www.tmforum.org/json-schemas/Error.schema.json',
      '@type': 'Error',
      timestamp: new Date().toISOString()
    };
    
    return errorResponse;
  }

  // Middleware to handle errors in Express
  static handleError(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || [];

    // Enhanced error logging
    logger.error({
      message: `${statusCode} - ${message}`,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      details: details
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      details = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        type: e.kind
      }));
    } else if (err.code === 11000) {
      statusCode = 409;
      message = 'Duplicate Key Error';
      details = [{
        field: Object.keys(err.keyPattern)[0],
        message: 'Duplicate value',
        type: 'DUPLICATE_KEY'
      }];
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      details = [{
        field: err.path,
        message: 'Invalid identifier format',
        type: 'INVALID_ID'
      }];
    }

    // Send the error response
    res.status(statusCode).json(TMFErrorHandler.createTMFError(statusCode, message, details));
  }

  // Middleware to handle 404 Not Found
  static handleNotFound(req, res, next) {
    const error = TMFErrorHandler.createTMFError(404, `Not Found - ${req.originalUrl}`);
    res.status(404).json(error);
  }

  // Utility to throw validation errors
  static throwValidationError(message, details = []) {
    const error = new Error(message);
    error.statusCode = 400;
    error.details = details;
    throw error;
  }
}

module.exports = TMFErrorHandler;