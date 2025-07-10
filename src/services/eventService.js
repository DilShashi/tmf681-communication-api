const Event = require('../models/Event');
const { eventSchema, stateChangeEventSchema, attributeChangeEventSchema } = require('../schemas/eventSchema');
const logger = require('../utils/logger');

class EventService {
  // Create a new event
  static async createEvent(eventData) {
    try {
      // Set defaults if not provided
      const completeEventData = {
        eventTime: new Date(),
        ...eventData
      };

      const { error } = eventSchema.validate(completeEventData);
      if (error) {
        throw new Error(`Event validation error: ${error.details[0].message}`);
      }

      // Additional validation based on event type
      if (completeEventData.eventType === 'CommunicationMessageStateChangeEvent') {
        const { error: stateError } = stateChangeEventSchema.validate(completeEventData.event);
        if (stateError) {
          throw new Error(`State change event validation error: ${stateError.details[0].message}`);
        }
      } else if (completeEventData.eventType === 'CommunicationMessageAttributeValueChangeEvent') {
        const { error: attrError } = attributeChangeEventSchema.validate(completeEventData.event);
        if (attrError) {
          throw new Error(`Attribute change event validation error: ${attrError.details[0].message}`);
        }
      }

      const event = new Event(completeEventData);
      await event.save();
      logger.info(`Created new ${completeEventData.eventType} event with ID ${event.id}`);
      
      return event;
    } catch (error) {
      logger.error(`Error creating event: ${error.message}`);
      throw error;
    }
  }

  // Get events with optional filtering
  static async getEvents(filters = {}, limit = 100) {
    try {
      return await Event.find(filters)
        .sort({ eventTime: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      logger.error(`Error retrieving events: ${error.message}`);
      throw error;
    }
  }

  // Notify registered listeners about an event
  static async notifyListeners(event) {
    try {
      // In a real implementation, this would notify all registered listeners
      // For this dummy implementation, we'll just log it
      logger.info(`Would notify listeners about event ${event.id} of type ${event.eventType}`);
      return true;
    } catch (error) {
      logger.error(`Error notifying listeners: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EventService;
