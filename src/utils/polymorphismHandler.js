const logger = require('./logger');

class PolymorphismHandler {
  // Extract the concrete type from a polymorphic object
  static getConcreteType(obj) {
    if (!obj) return null;
    
    // Check for @type first (most specific)
    if (obj['@type']) {
      return obj['@type'];
    }
    
    // Fall back to @baseType
    if (obj['@baseType']) {
      return obj['@baseType'];
    }
    
    // No type information found
    return null;
  }

  // Validate an object against its declared type
  static validateAgainstType(obj, schemaMap) {
    const type = this.getConcreteType(obj);
    if (!type) {
      logger.warn('No type information found for polymorphic object');
      return false;
    }
    
    const schema = schemaMap[type];
    if (!schema) {
      logger.warn(`No schema found for type ${type}`);
      return false;
    }
    
    const { error } = schema.validate(obj);
    if (error) {
      logger.warn(`Validation failed for ${type}: ${error.message}`);
      return false;
    }
    
    return true;
  }

  // Handle polymorphic references when saving to database
  static async handlePolymorphicReferences(document, modelMap) {
    for (const [fieldName, modelName] of Object.entries(modelMap)) {
      if (document[fieldName] && typeof document[fieldName] === 'object') {
        const type = this.getConcreteType(document[fieldName]);
        if (type && modelName[type]) {
          const Model = modelName[type];
          const refDoc = new Model(document[fieldName]);
          const savedRef = await refDoc.save();
          document[fieldName] = savedRef._id;
        }
      }
    }
  }

  // Resolve polymorphic references when querying from database
  static async resolvePolymorphicReferences(document, modelMap) {
    const result = document.toObject ? document.toObject() : { ...document };
    
    for (const [fieldName, modelName] of Object.entries(modelMap)) {
      if (result[fieldName] && typeof result[fieldName] === 'object' && result[fieldName]._id) {
        const type = this.getConcreteType(result[fieldName]);
        if (type && modelName[type]) {
          const Model = modelName[type];
          const refDoc = await Model.findById(result[fieldName]._id);
          if (refDoc) {
            result[fieldName] = refDoc.toObject ? refDoc.toObject() : refDoc;
          }
        }
      }
    }
    
    return result;
  }
}

module.exports = PolymorphismHandler;