// src/utils/validator.js
const Joi = require('joi');
const {
  communicationMessageSchema,
  createCommunicationMessageSchema,
  updateCommunicationMessageSchema,
  attachmentSchema,
  characteristicSchema,
  receiverSchema,
  senderSchema
} = require('../schemas/communicationSchema');
const { eventSchema } = require('../schemas/eventSchema');
const logger = require('./logger');

class Validator {
  static validateCommunicationMessage(message, isUpdate = false) {
    try {
      const schema = isUpdate ? updateCommunicationMessageSchema : createCommunicationMessageSchema;
      const validationOptions = {
        abortEarly: false
      };

      // First validate main message structure
      const { error: mainError } = schema.validate(message, validationOptions);

      if (mainError) {
        return mainError.details.map(d => ({
          path: d.path.join('.'),
          message: d.message
        }));
      }

      // Validate each attachment if present
      if (message.attachment && Array.isArray(message.attachment)) {
        for (const [index, attachment] of message.attachment.entries()) {
          const { error: attachmentError } = attachmentSchema.validate(attachment, validationOptions);
          if (attachmentError) {
            return attachmentError.details.map(d => ({
              path: `attachment[${index}].${d.path.join('.')}`,
              message: d.message
            }));
          }
        }
      }

      // Validate each characteristic if present
      if (message.characteristic && Array.isArray(message.characteristic)) {
        for (const [index, characteristic] of message.characteristic.entries()) {
          const { error: characteristicError } = characteristicSchema.validate(characteristic, validationOptions);
          if (characteristicError) {
            return characteristicError.details.map(d => ({
              path: `characteristic[${index}].${d.path.join('.')}`,
              message: d.message
            }));
          }
        }
      }

      // Validate each receiver
      if (message.receiver && Array.isArray(message.receiver)) {
        for (const [index, receiver] of message.receiver.entries()) {
          const { error: receiverError } = receiverSchema.validate(receiver, validationOptions);
          if (receiverError) {
            return receiverError.details.map(d => ({
              path: `receiver[${index}].${d.path.join('.')}`,
              message: d.message
            }));
          }
        }
      }

      // Validate sender
      if (message.sender) {
        const { error: senderError } = senderSchema.validate(message.sender, validationOptions);
        if (senderError) {
          return senderError.details.map(d => ({
            path: `sender.${d.path.join('.')}`,
            message: d.message
          }));
        }
      }

      return null;
    } catch (err) {
      logger.error(`Validation error: ${err.message}`);
      return [{ path: 'validation', message: 'Internal validation error' }];
    }
  }

  static validateEvent(event) {
    try {
      const { error } = eventSchema.validate(event, { 
        abortEarly: false
      });
      
      if (error) {
        const details = error.details.map(d => d.message);
        logger.warn(`Event validation failed: ${details.join(', ')}`);
        return details;
      }
      
      return null;
    } catch (err) {
      logger.error(`Event validation error: ${err.message}`);
      return ['Internal validation error'];
    }
  }

  static validatePolymorphicObject(obj, schemaMap) {
    try {
      if (!obj || !schemaMap) {
        logger.warn('Invalid parameters for polymorphic validation');
        return ['Invalid validation parameters'];
      }

      const type = obj['@type'] || obj['@baseType'];
      if (!type) {
        return ['Missing @type or @baseType for polymorphic object'];
      }

      const schema = schemaMap[type];
      if (!schema) {
        return [`No schema found for type ${type}`];
      }

      const { error } = schema.validate(obj, { 
        abortEarly: false
      });
      if (error) {
        return error.details.map(d => d.message);
      }

      return null;
    } catch (err) {
      logger.error(`Polymorphic validation error: ${err.message}`);
      return ['Internal validation error'];
    }
  }
}

module.exports = Validator;