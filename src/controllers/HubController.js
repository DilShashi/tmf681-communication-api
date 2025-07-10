const Event = require('../models/Event');
const logger = require('../utils/logger');
const config = require('../config/tmf-config');

class HubController {
  // Register a new listener for events
  static async registerListener(req, res) {
    try {
      const { callback, query } = req.body;
      
      if (!callback) {
        return res.status(400).json({ error: 'Callback URL is required' });
      }
      
      // In a real implementation, you would store this listener in a database
      // For this dummy implementation, we'll just return a success response
      const listenerId = `listener-${Date.now()}`;
      
      res.status(201).json({
        id: listenerId,
        callback,
        query
      });
    } catch (error) {
      logger.error(`Error registering listener: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Unregister a listener
  static async unregisterListener(req, res) {
    try {
      const { id } = req.params;
      
      // In a real implementation, you would remove this listener from the database
      // For this dummy implementation, we'll just return a success response
      
      res.status(204).end();
    } catch (error) {
      logger.error(`Error unregistering listener: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle attribute change event specifically
  static async handleAttributeChangeEvent(req, res) {
    try {
      const { event } = req.body;
      
      if (!event || !event.communicationMessage) {
        return res.status(400).json({ 
          code: 400,
          reason: "Bad Request",
          message: "Invalid event format",
          details: "Event must contain communicationMessage",
          status: "400",
          "@baseType": "Error",
          "@schemaLocation": "http://www.tmforum.org/json-schemas/Error.schema.json",
          "@type": "Error",
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`Received attribute change event for message ${event.communicationMessage.id}`);
      
      // Create a proper response according to TMF spec
      res.status(200).json({
        eventId: event.eventId || new Date().getTime().toString(),
        eventTime: new Date().toISOString(),
        eventType: "CommunicationMessageAttributeValueChangeEvent",
        correlationId: event.correlationId || null,
        domain: event.domain || "communication",
        title: event.title || "Attribute Value Change",
        description: event.description || "Attribute value changed",
        priority: event.priority || "Medium",
        timeOcurred: event.timeOcurred || new Date().toISOString(),
        fieldPath: event.fieldPath || null,
        event: {
          communicationMessage: {
            id: event.communicationMessage.id,
            href: event.communicationMessage.href || 
              `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${event.communicationMessage.id}`,
            content: event.communicationMessage.content || "",
            description: event.communicationMessage.description || "",
            state: event.communicationMessage.state || "initial"
          },
          changedAttributes: event.changedAttributes || {}
        }
      });
    } catch (error) {
      logger.error(`Error handling attribute change event: ${error.message}`);
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: error.message,
        status: "500",
        "@baseType": "Error",
        "@schemaLocation": "http://www.tmforum.org/json-schemas/Error.schema.json",
        "@type": "Error",
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle state change event specifically
  static async handleStateChangeEvent(req, res) {
    try {
      // Changed to accept the exact structure from Postman test
      const { event } = req.body;
      
      if (!event || !event.communicationMessage || !event.communicationMessage.state) {
        return res.status(400).json({
          code: 400,
          reason: "Bad Request",
          message: "Invalid event format",
          details: "Event must contain communicationMessage with state",
          status: "400",
          "@baseType": "Error",
          "@schemaLocation": "http://www.tmforum.org/json-schemas/Error.schema.json",
          "@type": "Error",
          timestamp: new Date().toISOString()
        });
      }

      logger.info(`Received state change event for message ${event.communicationMessage.id}, new state: ${event.communicationMessage.state}`);
      
      // Create a proper response according to TMF spec
      const response = {
        eventId: event.eventId || new Date().getTime().toString(),
        eventTime: new Date().toISOString(),
        eventType: "CommunicationMessageStateChangeEvent",
        correlationId: event.correlationId || null,
        domain: event.domain || "communication",
        title: event.title || "State Change",
        description: event.description || "State changed",
        priority: event.priority || "Medium",
        timeOcurred: event.timeOcurred || new Date().toISOString(),
        fieldPath: event.fieldPath || null,
        event: {
          communicationMessage: {
            id: event.communicationMessage.id,
            href: event.communicationMessage.href || 
              `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${event.communicationMessage.id}`,
            state: event.communicationMessage.state,
            // Include all required fields from the test case
            content: event.communicationMessage.content || "",
            description: event.communicationMessage.description || "",
            logFlag: event.communicationMessage.logFlag || false,
            messageType: event.communicationMessage.messageType || "",
            priority: event.communicationMessage.priority || "",
            scheduledSendTime: event.communicationMessage.scheduledSendTime || "",
            sendTime: event.communicationMessage.sendTime || "",
            sendTimeComplete: event.communicationMessage.sendTimeComplete || "",
            subject: event.communicationMessage.subject || "",
            tryTimes: event.communicationMessage.tryTimes || 0
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error handling state change event: ${error.message}`);
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: error.message,
        status: "500",
        "@baseType": "Error",
        "@schemaLocation": "http://www.tmforum.org/json-schemas/Error.schema.json",
        "@type": "Error",
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle event notifications (callback endpoint)
  static async handleEventNotification(req, res) {
    try {
      const { event, eventType } = req.body;
      
      // In a real implementation, you would process the event
      // For this dummy implementation, we'll just log it
      logger.info(`Received event of type ${eventType}: ${JSON.stringify(event)}`);
      
      res.status(201).json({ status: 'Event received' });
    } catch (error) {
      logger.error(`Error handling event notification: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = HubController;
