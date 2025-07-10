const config = require('../config/tmf-config');
const logger = require('./logger');

class URIHandler {
  // Generate href for a resource
  static generateHref(resourceType, resourceId) {
    if (!resourceType || !resourceId) {
      logger.warn('Cannot generate href - missing resourceType or resourceId');
      return null;
    }

    const basePath = config.api.basePath || '/tmf-api/communicationManagement/v4';
    return `${config.api.baseUrl}${basePath}/${resourceType}/${resourceId}`;
  }

  // Parse resource ID from href
  static parseIdFromHref(href) {
    if (!href) return null;
    
    try {
      const parts = href.split('/');
      return parts[parts.length - 1];
    } catch (error) {
      logger.error(`Error parsing ID from href: ${error.message}`);
      return null;
    }
  }

  // Validate a URI
  static isValidURI(uri) {
    if (!uri) return false;
    try {
      new URL(uri);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate schema location URI
  static generateSchemaLocation(type) {
    return `${config.schema.baseUrl}/${type}.schema.json`;
  }
}

module.exports = URIHandler;
