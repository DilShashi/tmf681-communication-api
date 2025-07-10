const Event = require('../models/Event');
const { STATE_CHANGE } = require('./eventTypes');
const logger = require('../utils/logger');

// Publish a state change event
async function publishStateChangeEvent(communicationMessage, newState) {
  try {
    const eventPayload = {
      communicationMessage: communicationMessage.toObject ? communicationMessage.toObject() : communicationMessage,
      state: newState
    };

    const event = new Event({
      eventType: STATE_CHANGE,
      event: eventPayload,
      description: `State changed to ${newState}`,
      domain: "Communication"
    });

    const savedEvent = await event.save();
    logger.info(`Published state change event for message ${communicationMessage.id}, new state: ${newState}`);
    
    return savedEvent;
  } catch (error) {
    logger.error(`Error publishing state change event: ${error.message}`);
    throw error;
  }
}

module.exports = {
  publishStateChangeEvent,
  publishAttributeChangeEvent: require('./attributeChangeEvent').publishAttributeChangeEvent
};