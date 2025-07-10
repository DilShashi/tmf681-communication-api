const CommunicationMessage = require('../models/CommunicationMessage');
const EventService = require('./eventService');
const logger = require('../utils/logger');
const { STATE_CHANGE, ATTRIBUTE_CHANGE } = require('../events/eventTypes');

class NotificationService {
  // Send a notification based on message state
  static async sendNotification(message, newState) {
    try {
      // Determine notification type based on state
      let notificationType;
      let notificationContent;
      
      switch (newState) {
        case 'completed':
          notificationType = 'DeliveryConfirmation';
          notificationContent = `Your message has been delivered: ${message.content.substring(0, 30)}...`;
          break;
        case 'failed':
          notificationType = 'DeliveryFailure';
          notificationContent = `Failed to deliver your message: ${message.content.substring(0, 30)}...`;
          break;
        default:
          return; // No notification for other states
      }
      
      logger.info(`Sending ${notificationType} notification for message ${message.id}`);
      
      // In a real implementation, this would actually send the notification
      // via SMS, email, etc. based on message.messageType
      
      return true;
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`);
      throw error;
    }
  }

  // Publish a state change event
  static async publishStateChange(message, newState) {
    try {
      const event = await EventService.createEvent({
        eventType: STATE_CHANGE,
        eventTime: new Date(),
        event: {
          communicationMessage: message.toObject(),
          state: newState
        }
      });
      
      await EventService.notifyListeners(event);
      return event;
    } catch (error) {
      logger.error(`Error publishing state change: ${error.message}`);
      throw error;
    }
  }

  // Publish an attribute value change event
  static async publishAttributeChange(message, changedAttributes) {
    try {
      const event = await EventService.createEvent({
        eventType: ATTRIBUTE_CHANGE,
        eventTime: new Date(),
        event: {
          communicationMessage: message.toObject(),
          changedAttributes: changedAttributes
        }
      });
      
      await EventService.notifyListeners(event);
      return event;
    } catch (error) {
      logger.error(`Error publishing attribute change: ${error.message}`);
      throw error;
    }
  }
}

module.exports = NotificationService;