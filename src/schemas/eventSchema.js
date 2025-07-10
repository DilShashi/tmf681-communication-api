// src/schemas/eventSchema.js
const Joi = require('joi');
const { STATE_CHANGE, ATTRIBUTE_CHANGE } = require('../events/eventTypes');

// Base event schema
const eventSchema = Joi.object({
  correlationId: Joi.string().description('The correlation id for this event'),
  description: Joi.string().description('An explanatory of the event'),
  domain: Joi.string().description('The domain of the event'),
  eventId: Joi.string().description('The identifier of the event'),
  eventTime: Joi.date().description('The time of the event'),
  eventType: Joi.string().valid(STATE_CHANGE, ATTRIBUTE_CHANGE).required()
    .description('The type of the event'),
  fieldPath: Joi.string().description('The path identifying the object field concerned'),
  href: Joi.string().uri().description('Reference of the event'),
  id: Joi.string().description('Unique identifier of the event'),
  priority: Joi.string().description('A priority for the event'),
  timeOccurred: Joi.date().description('The time the event occurred'),
  title: Joi.string().description('The title of the event'),
  event: Joi.object({
    communicationMessage: Joi.object({
      id: Joi.string().required(),
      href: Joi.string().uri()
    }).unknown(true).required()
  }).unknown(true).required()
}).options({ allowUnknown: true });

// State change event payload schema
const stateChangeEventSchema = Joi.object({
  communicationMessage: Joi.object({
    id: Joi.string().required(),
    href: Joi.string().uri(),
    state: Joi.string().valid('initial', 'inProgress', 'completed', 'cancelled', 'failed', 'deleted')
      .required(),
    // Add all fields that might be included in the test case
    content: Joi.string(),
    description: Joi.string(),
    logFlag: Joi.boolean(),
    messageType: Joi.string(),
    priority: Joi.string(),
    scheduledSendTime: Joi.date(),
    sendTime: Joi.date(),
    sendTimeComplete: Joi.date(),
    subject: Joi.string(),
    tryTimes: Joi.number(),
    attachment: Joi.array(),
    characteristic: Joi.array(),
    receiver: Joi.array(),
    sender: Joi.object()
  }).unknown(true).required()
}).options({ allowUnknown: true });

// Attribute change event payload schema
const attributeChangeEventSchema = Joi.object({
  communicationMessage: Joi.object({
    id: Joi.string().required(),
    href: Joi.string().uri()
  }).unknown(true).required(),
  changedAttributes: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      oldValue: Joi.any().description('The previous value of the attribute'),
      newValue: Joi.any().description('The new value of the attribute')
    })
  ).required().description('Map of changed attributes')
}).options({ allowUnknown: true });

module.exports = {
  eventSchema,
  stateChangeEventSchema,
  attributeChangeEventSchema
};