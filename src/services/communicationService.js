const CommunicationMessage = require('../models/CommunicationMessage');
const { publishStateChangeEvent, publishAttributeChangeEvent } = require('../events/stateChangeEvent');
const logger = require('../utils/logger');
const { createCommunicationMessageSchema, updateCommunicationMessageSchema } = require('../schemas/communicationSchema');
const stateMachineService = require('./stateMachineService');
const retryService = require('./retryService');

class CommunicationService {
  // List communication messages with optional filtering
  static async listMessages(filters = {}, fields = '') {
    try {
      let query = CommunicationMessage.find(filters);
      
      if (fields) {
        const selectedFields = fields.split(',').join(' ');
        query = query.select(selectedFields);
      }
      
      return await query
        .populate('attachment')
        .populate('characteristic')
        .populate('receiver')
        .populate('sender')
        .exec();
    } catch (error) {
      logger.error(`Error listing messages: ${error.message}`);
      throw error;
    }
  }

  // Get a specific communication message by ID
  static async getMessageById(messageId) {
    try {
      const message = await CommunicationMessage.findById(messageId)
        .populate('attachment')
        .populate('characteristic')
        .populate('receiver')
        .populate('sender')
        .exec();
      
      if (!message) {
        throw new Error('Message not found');
      }
      
      return message;
    } catch (error) {
      logger.error(`Error retrieving message ${messageId}: ${error.message}`);
      throw error;
    }
  }

  // Create a new communication message
  static async createMessage(messageData) {
    try {
      const { error } = createCommunicationMessageSchema.validate(messageData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const newMessage = new CommunicationMessage(messageData);
      const savedMessage = await newMessage.save();
      
      // Publish creation event
      await publishStateChangeEvent(savedMessage, 'initial');
      
      return savedMessage;
    } catch (error) {
      logger.error(`Error creating message: ${error.message}`);
      throw error;
    }
  }

  // Update a communication message
  static async updateMessage(messageId, updateData) {
    try {
      const { error } = updateCommunicationMessageSchema.validate(updateData);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const message = await CommunicationMessage.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Track changes for attribute change events
      const originalState = message.state;
      const changedAttributes = {};
      
      for (const key in updateData) {
        if (message[key] !== undefined && message[key] !== updateData[key]) {
          changedAttributes[key] = {
            oldValue: message[key],
            newValue: updateData[key]
          };
          message[key] = updateData[key];
        }
      }

      // Validate state transition if state is being changed
      if (updateData.state && updateData.state !== originalState) {
        if (!stateMachineService.isValidTransition(originalState, updateData.state)) {
          throw new Error(`Invalid state transition from ${originalState} to ${updateData.state}`);
        }
      }

      const updatedMessage = await message.save();
      
      // Publish state change event if state was modified
      if (originalState !== updatedMessage.state) {
        await publishStateChangeEvent(updatedMessage, updatedMessage.state);
      }
      
      // Publish attribute change events for other modified fields
      if (Object.keys(changedAttributes).length > 0) {
        await publishAttributeChangeEvent(updatedMessage, changedAttributes);
      }
      
      return updatedMessage;
    } catch (error) {
      logger.error(`Error updating message ${messageId}: ${error.message}`);
      throw error;
    }
  }

  // Delete a communication message
  static async deleteMessage(messageId) {
    try {
      const message = await CommunicationMessage.findByIdAndDelete(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Publish deletion event
      await publishStateChangeEvent(message, 'deleted');
      
      return message;
    } catch (error) {
      logger.error(`Error deleting message ${messageId}: ${error.message}`);
      throw error;
    }
  }

  // Send a communication message
  static async sendMessage(messageId) {
    try {
      const message = await CommunicationMessage.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Validate state transition
      if (!stateMachineService.isValidTransition(message.state, 'inProgress')) {
        throw new Error(`Cannot send message in ${message.state} state`);
      }

      // Update message state
      message.state = 'inProgress';
      message.sendTime = new Date();
      await message.save();
      
      // Publish state change event
      await publishStateChangeEvent(message, 'inProgress');
      
      // Attempt to send the message (with retry logic)
      await retryService.sendWithRetry(message);
      
      return message;
    } catch (error) {
      logger.error(`Error sending message ${messageId}: ${error.message}`);
      
      // Update message state to failed
      const message = await CommunicationMessage.findById(messageId);
      if (message) {
        message.state = 'failed';
        await message.save();
        await publishStateChangeEvent(message, 'failed');
      }
      
      throw error;
    }
  }
}

module.exports = CommunicationService;
