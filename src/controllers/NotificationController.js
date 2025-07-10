const Event = require('../models/Event');
const logger = require('../utils/logger');

class NotificationController {
  // Publish a state change event
  static async publishStateChangeEvent(req, res) {
    try {
      // Extract from the exact structure used in Postman
      const { communicationMessage, eventType } = req.body;
      
      if (!communicationMessage || !communicationMessage.state) {
        return res.status(400).json({
          error: 'Invalid request format',
          details: 'Request must contain: {communicationMessage: {id: "...", state: "..."}, eventType: "..."}',
          example: {
            communicationMessage: {
              id: "123",
              state: "completed"
            },
            eventType: "CommunicationMessageStateChangeEvent"
          }
        });
      }

      const event = new Event({
        eventType: eventType || 'CommunicationMessageStateChangeEvent',
        eventTime: new Date(),
        event: {
          communicationMessage: communicationMessage,
          state: communicationMessage.state
        }
      });

      await event.save();

      res.status(201).json(event);
    } catch (error) {
      logger.error(`Error publishing state change event: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  // Keep existing attribute change method exactly as before
  static async publishAttributeChangeEvent(req, res) {
    try {
      const { communicationMessage, changedAttributes, eventType } = req.body;
      
      if (!communicationMessage || !changedAttributes) {
        return res.status(400).json({ 
          error: 'communicationMessage and changedAttributes are required',
          details: 'Request must contain both communicationMessage and changedAttributes'
        });
      }
      
      const event = new Event({
        eventType: eventType || 'CommunicationMessageAttributeValueChangeEvent',
        eventTime: new Date(),
        event: {
          communicationMessage: communicationMessage,
          changedAttributes: changedAttributes
        }
      });
      
      await event.save();
      
      res.status(201).json(event);
    } catch (error) {
      logger.error(`Error publishing attribute change event: ${error.message}`);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = NotificationController;
