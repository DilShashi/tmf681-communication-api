const Event = require('../models/Event');
const logger = require('../utils/logger');

// Publish an attribute value change event
async function publishAttributeChangeEvent(communicationMessage, changedAttributes) {
  try {
    const eventPayload = {
      communicationMessage: communicationMessage.toObject ? communicationMessage.toObject() : communicationMessage,
      changedAttributes: changedAttributes
    };

    const event = new Event({
      eventType: 'CommunicationMessageAttributeValueChangeEvent',
      event: eventPayload,
      description: `Attributes changed: ${Object.keys(changedAttributes).join(', ')}`,
      domain: "Communication"
    });

    const savedEvent = await event.save();
    logger.info(`Published attribute change event for message ${communicationMessage.id}`);
    
    return savedEvent;
  } catch (error) {
    logger.error(`Error publishing attribute change event: ${error.message}`);
    throw error;
  }
}

module.exports = {
  publishAttributeChangeEvent
};