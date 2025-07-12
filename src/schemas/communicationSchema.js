// src/schemas/communicationSchema.js
const Joi = require('joi');
const { STATE_CHANGE, ATTRIBUTE_CHANGE } = require('../events/eventTypes');

// Schema for Attachment sub-resource
const attachmentSchema = Joi.object({
  attachmentType: Joi.string().description('Attachment type such as video, picture'),
  content: Joi.string().description('The actual contents of the attachment object, if embedded, encoded as base64'),
  description: Joi.string().description('A narrative text describing the content of the attachment'),
  href: Joi.string().uri().description('URI for this Attachment'),
  id: Joi.string().description('Unique identifier for this particular attachment'),
  mimeType: Joi.string().description('Attachment mime type such as extension file for video, picture and document'),
  name: Joi.string().required().description('The name of the attachment'),
  size: Joi.object({
    amount: Joi.number(),
    units: Joi.string()
  }).description('The size of the attachment'),
  url: Joi.string().uri().required().description('Uniform Resource Locator, is a web page address (a subset of URI)'),
  validFor: Joi.object({
    startDateTime: Joi.date(),
    endDateTime: Joi.date()
  }).description('The period of time for which the attachment is valid'),
  "@type": Joi.string().default('Attachment')
}).options({ allowUnknown: true });

// Schema for Characteristic sub-resource
const characteristicSchema = Joi.object({
  id: Joi.string().description('Unique identifier of the characteristic'),
  name: Joi.string().required().description('Name of the characteristic'),
  value: Joi.any().required().description('The value of the characteristic'),
  valueType: Joi.string().description('Data type of the value of the characteristic'),
  characteristicRelationship: Joi.array().items(Joi.object({
    id: Joi.string(),
    relationshipType: Joi.string()
  })).description('Another Characteristic that is related to the current Characteristic'),
  "@baseType": Joi.string().description('When sub-classing, this defines the super-class'),
  "@schemaLocation": Joi.string().uri().description('A URI to a JSON-Schema file that defines additional attributes and relationships'),
  "@type": Joi.string().default('Characteristic')
}).options({ allowUnknown: true });

// Schema for Receiver sub-resource
const receiverSchema = Joi.object({
  appUserId: Joi.string().description('ID of the mobile app user'),
  email: Joi.string().email().when('messageType', {
    is: 'Email',
    then: Joi.required(),
    otherwise: Joi.optional().allow('')
  }),
  id: Joi.string().description('ID of the receiver'),
  ip: Joi.string().description('IP address of the receiver'),
  name: Joi.string().required().description('Name of the receiver'),
  party: Joi.object({
    href: Joi.string().uri(),
    id: Joi.string(),
    name: Joi.string(),
    role: Joi.string(),
    "@baseType": Joi.string(),
    "@referredType": Joi.string(),
    "@schemaLocation": Joi.string().uri(),
    "@type": Joi.string()
  }).description('Related Entity reference'),
  phoneNumber: Joi.string().when('messageType', {
    is: 'SMS',
    then: Joi.required(),
    otherwise: Joi.optional().allow('')
  }),
  "@type": Joi.string().default('Receiver')
}).options({ allowUnknown: true });

// Schema for Sender sub-resource
const senderSchema = Joi.object({
  email: Joi.string().email().when('messageType', {
    is: 'Email',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  id: Joi.string().description('ID of the sender'),
  name: Joi.string().description('Name of the sender'),
  party: Joi.object({
    href: Joi.string().uri(),
    id: Joi.string(),
    name: Joi.string(),
    role: Joi.string(),
    "@baseType": Joi.string(),
    "@referredType": Joi.string(),
    "@schemaLocation": Joi.string().uri(),
    "@type": Joi.string()
  }).description('Related Entity reference'),
  phoneNumber: Joi.string().when('messageType', {
    is: 'SMS',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  "@type": Joi.string().default('Sender')
}).options({ allowUnknown: true });

// Schema for validating CommunicationMessage entities
const communicationMessageSchema = Joi.object({
  content: Joi.string().required().description('The content of the communication message'),
  description: Joi.string().description('Description for the whole object'),
  href: Joi.string().uri().description('Hypertext Reference of the Communication Message'),
  id: Joi.string().description('Unique identifier of Communication Message'),
  logFlag: Joi.boolean().default(false).description('Flag indicating if message should be logged'),
  messageType: Joi.string().valid('SMS', 'Email', 'MobileAppPush').required(),
  priority: Joi.string().description('The priority of the communication message'),
  scheduledSendTime: Joi.date().description('The scheduled time for sending the communication message'),
  sendTime: Joi.date().description('The time of sending communication message'),
  sendTimeComplete: Joi.date().description('The time of completion of sending communication message'),
  state: Joi.string().valid('initial', 'inProgress', 'completed', 'cancelled', 'failed').default('initial')
    .description('Status of communication message'),
  subject: Joi.string().description('The title of the message'),
  tryTimes: Joi.number().integer().min(1).default(1)
    .description('How many times to retry the delivery of this message'),
  attachment: Joi.array().items(attachmentSchema).description('List of attachments'),
  characteristic: Joi.array().items(characteristicSchema).description('List of characteristics'),
  receiver: Joi.array().items(receiverSchema).min(1).required(),
  sender: senderSchema.required(),
  "@baseType": Joi.string().description('When sub-classing, this defines the super-class'),
  "@schemaLocation": Joi.string().uri().description('URI to JSON-Schema file'),
  "@type": Joi.string().default('CommunicationMessage').description('The class type of the resource')
}).options({ allowUnknown: true });

// Schema for validating CommunicationMessage creation
const createCommunicationMessageSchema = Joi.object({
  subject: Joi.string().description('The title of the message'),
  scheduledSendTime: Joi.date().description('The scheduled time for sending the communication message'),
  state: Joi.string().valid('initial', 'inProgress', 'completed', 'cancelled', 'failed').default('initial'),
  description: Joi.string().description('Description for the whole object'),
  content: Joi.string().required().description('The content of the communication message'),
  messageType: Joi.string().valid('SMS', 'Email', 'MobileAppPush').required(),
  priority: Joi.string().description('The priority of the communication message'),
  logFlag: Joi.boolean().default(false),
  tryTimes: Joi.number().integer().min(1).default(1),
  attachment: Joi.array().items(attachmentSchema),
  characteristic: Joi.array().items(characteristicSchema),
  receiver: Joi.alternatives().try(
    Joi.array().items(receiverSchema).min(1),
    receiverSchema
  ).required(),
  sender: senderSchema.required(),
  "@baseType": Joi.string(),
  "@schemaLocation": Joi.string().uri(),
  "@type": Joi.string().default('CommunicationMessage')
}).options({ allowUnknown: true });

// Schema for validating CommunicationMessage updates
const updateCommunicationMessageSchema = Joi.object({
  content: Joi.string().description('The content of the communication message'),
  description: Joi.string().description('Description for the whole object'),
  logFlag: Joi.boolean().description('Flag indicating if message should be logged'),
  messageType: Joi.string().valid('SMS', 'Email', 'MobileAppPush')
    .description('The type of message'),
  priority: Joi.string().description('The priority of the communication message'),
  scheduledSendTime: Joi.date().description('The scheduled time for sending the communication message'),
  state: Joi.string().valid('initial', 'inProgress', 'completed', 'cancelled', 'failed')
    .description('Status of communication message'),
  subject: Joi.string().description('The title of the message'),
  tryTimes: Joi.number().integer().min(1).description('How many times to retry the delivery'),
  attachment: Joi.array().items(attachmentSchema).description('List of attachments'),
  characteristic: Joi.array().items(characteristicSchema).description('List of characteristics'),
  receiver: Joi.array().items(receiverSchema).min(1).description('The receiver(s) of this message'),
  sender: senderSchema.description('The sender of this message'),
  "@baseType": Joi.string().description('When sub-classing, this defines the super-class'),
  "@schemaLocation": Joi.string().uri().description('URI to JSON-Schema file'),
  "@type": Joi.string().description('The class type of the resource')
}).options({ allowUnknown: true });

module.exports = {
  communicationMessageSchema,
  createCommunicationMessageSchema,
  updateCommunicationMessageSchema,
  attachmentSchema,
  characteristicSchema,
  receiverSchema,
  senderSchema
};