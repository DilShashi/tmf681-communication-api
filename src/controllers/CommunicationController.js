// src/controllers/CommunicationController.js
const mongoose = require('mongoose');
const CommunicationMessage = require('../models/CommunicationMessage');
const Attachment = require('../models/Attachment');
const Characteristic = require('../models/Characteristic');
const Receiver = require('../models/Receiver');
const Sender = require('../models/Sender');
const { publishStateChangeEvent, publishAttributeChangeEvent } = require('../events/stateChangeEvent');
const logger = require('../utils/logger');
const Validator = require('../utils/validator');
const config = require('../config/tmf-config');
const TMFErrorHandler = require('../utils/tmfErrorHandler');
const stateMachineService = require('../services/stateMachineService');

class CommunicationController {
  static async listMessages(req, res) {
    try {
      const { 
        fields = '', 
        offset = 0, 
        limit = 100,
        ...filters 
      } = req.query;

      const numericOffset = parseInt(offset, 10);
      const numericLimit = Math.min(parseInt(limit, 10), 1000);

      let query = CommunicationMessage.find(filters)
        .skip(numericOffset)
        .limit(numericLimit);
      
      if (fields) {
        query = query.select(fields.split(','));
      }
      
      const messages = await query
        .populate('attachment')
        .populate({
          path: 'characteristic',
          populate: {
            path: 'characteristicRelationship',
            model: 'CharacteristicRelationship'
          }
        })
        .populate('receiver')
        .populate('sender')
        .lean()
        .exec();
      
      const messagesWithHref = messages.map(msg => ({
        ...msg,
        href: msg.href || `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${msg.id}`
      }));
      
      res.status(200).json(messagesWithHref);
    } catch (error) {
      logger.error(`Error listing messages: ${error.message}`);
      res.status(500).json(
        TMFErrorHandler.createTMFError(500, 'Internal server error')
      );
    }
  }

  static async getMessage(req, res) {
    try {
      let message;
      
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        message = await CommunicationMessage.findOne({ 
          $or: [{ _id: req.params.id }, { id: req.params.id }] 
        })
        .populate('attachment')
        .populate({
          path: 'characteristic',
          populate: {
            path: 'characteristicRelationship',
            model: 'CharacteristicRelationship'
          }
        })
        .populate('receiver')
        .populate('sender')
        .lean()
        .exec();
      }

      if (!message) {
        return res.status(404).json(
          TMFErrorHandler.createTMFError(404, 'Message not found')
        );
      }

      if (!message.href) {
        message.href = `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${message.id}`;
        await CommunicationMessage.updateOne(
          { _id: message._id }, 
          { $set: { href: message.href } }
        );
      }

      if (req.query.fields) {
        const filteredMessage = {};
        req.query.fields.split(',').forEach(field => {
          if (message[field] !== undefined) {
            filteredMessage[field] = message[field];
          }
        });
        return res.status(200).json(filteredMessage);
      }

      res.status(200).json(message);
    } catch (error) {
      logger.error(`Error retrieving message: ${error.message}`);
      res.status(500).json(
        TMFErrorHandler.createTMFError(500, 'Internal server error')
      );
    }
  }

  static async createMessage(req, res) {
    try {
      // Transform form data to match API schema
      let messageData = req.body;
      if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        messageData = transformFormData(req.body);
      }

      // Ensure receiver array is properly formatted
      if (!Array.isArray(messageData.receiver)) {
        if (messageData.receiver) {
          messageData.receiver = [messageData.receiver];
        } else {
          messageData.receiver = [];
        }
      }

      const validationErrors = Validator.validateCommunicationMessage(messageData);
      if (validationErrors) {
        return res.status(400).json(
          TMFErrorHandler.createTMFError(400, 'Validation failed', validationErrors)
        );
      }

      // Process attachments if present
      const attachments = messageData.attachment && Array.isArray(messageData.attachment) 
        ? await Promise.all(
            messageData.attachment.map(async attachmentData => {
              const attachment = new Attachment({
                ...attachmentData,
                mimeType: attachmentData.mimeType || 'application/octet-stream',
                "@type": "Attachment"
              });
              const savedAttachment = await attachment.save();
              return savedAttachment._id;
            })
          )
        : [];

      // Process characteristics if present
      const characteristics = messageData.characteristic && Array.isArray(messageData.characteristic)
        ? await Promise.all(
            messageData.characteristic.map(async charData => {
              const characteristic = new Characteristic({
                ...charData,
                valueType: charData.valueType || 'string',
                "@type": "Characteristic"
              });
              const savedChar = await characteristic.save();
              return savedChar._id;
            })
          )
        : [];

      // Process receivers
      const receivers = await Promise.all(
        messageData.receiver.map(async receiverData => {
          const receiver = new Receiver({
            ...receiverData,
            "@type": "Receiver"
          });
          const savedReceiver = await receiver.save();
          return savedReceiver._id;
        })
      );

      // Process sender
      const sender = new Sender({
        ...messageData.sender,
        "@type": "Sender"
      });
      const savedSender = await sender.save();

      // Create the message
      const newMessage = new CommunicationMessage({
        ...messageData,
        attachment: attachments,
        characteristic: characteristics,
        receiver: receivers,
        sender: savedSender._id,
        "@type": "CommunicationMessage",
        state: messageData.state || 'initial',
        logFlag: messageData.logFlag || false,
        tryTimes: messageData.tryTimes || 1
      });

      const savedMessage = await newMessage.save();
      
      // Set href if not provided
      if (!savedMessage.href) {
        savedMessage.href = `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${savedMessage.id}`;
        await savedMessage.save();
      }
      
      // Publish state change event
      await publishStateChangeEvent(savedMessage, 'initial');
      
      // Return the created message
      const populatedMessage = await CommunicationMessage.findById(savedMessage._id)
        .populate('attachment')
        .populate({
          path: 'characteristic',
          populate: {
            path: 'characteristicRelationship',
            model: 'CharacteristicRelationship'
          }
        })
        .populate('receiver')
        .populate('sender')
        .lean()
        .exec();

      // Handle different response types
      if (req.headers.accept === 'text/html') {
        return res.redirect(`${config.api.basePath}/messages/${populatedMessage.id}`);
      }
      
      res.status(201).json(populatedMessage);
    } catch (error) {
      logger.error(`Error creating message: ${error.message}`);
      res.status(500).json(
        TMFErrorHandler.createTMFError(500, 'Internal server error', [
          { message: error.message }
        ])
      );
    }
  }

  static async updateMessage(req, res) {
    try {
      const message = await CommunicationMessage.findOne({ 
        $or: [{ _id: req.params.id }, { id: req.params.id }] 
      });
      
      if (!message) {
        return res.status(404).json(
          TMFErrorHandler.createTMFError(404, 'Message not found')
        );
      }

      const originalState = message.state;
      const changedAttributes = {};
      
      if (req.body.state && req.body.state !== originalState) {
        if (!stateMachineService.isValidTransition(originalState, req.body.state)) {
          return res.status(400).json(
            TMFErrorHandler.createTMFError(400, `Invalid state transition from ${originalState} to ${req.body.state}`)
          );
        }
      }

      for (const key in req.body) {
        if (message[key] !== undefined && message[key] !== req.body[key]) {
          changedAttributes[key] = {
            oldValue: message[key],
            newValue: req.body[key]
          };
          message[key] = req.body[key];
        }
      }

      const updatedMessage = await message.save();
      
      if (!updatedMessage.href) {
        updatedMessage.href = `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${updatedMessage.id}`;
        await updatedMessage.save();
      }

      if (originalState !== updatedMessage.state) {
        await publishStateChangeEvent(updatedMessage, updatedMessage.state);
      }
      
      if (Object.keys(changedAttributes).length > 0) {
        await publishAttributeChangeEvent(updatedMessage, changedAttributes);
      }

      const populatedMessage = await CommunicationMessage.findById(updatedMessage._id)
        .populate('attachment')
        .populate({
          path: 'characteristic',
          populate: {
            path: 'characteristicRelationship',
            model: 'CharacteristicRelationship'
          }
        })
        .populate('receiver')
        .populate('sender')
        .lean()
        .exec();

      res.status(200).json(populatedMessage);
    } catch (error) {
      logger.error(`Error updating message: ${error.message}`);
      res.status(500).json(
        TMFErrorHandler.createTMFError(500, 'Internal server error')
      );
    }
  }

  static async deleteMessage(req, res) {
    try {
      const message = await CommunicationMessage.findOneAndDelete({ 
        $or: [{ _id: req.params.id }, { id: req.params.id }] 
      });
      
      if (!message) {
        return res.status(404).json(
          TMFErrorHandler.createTMFError(404, 'Message not found')
        );
      }
      
      await publishStateChangeEvent(message, 'deleted');
      
      res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting message: ${error.message}`);
      res.status(500).json(
        TMFErrorHandler.createTMFError(500, 'Internal server error')
      );
    }
  }
}

// Helper function to transform form data
function transformFormData(formData) {
  const transformed = {
    subject: formData.subject,
    content: formData.content,
    messageType: formData.messageType,
    logFlag: formData.logFlag === 'on',
    sender: {
      name: formData['sender[name]']
    }
  };

  // Process receivers
  const receivers = [];
  let i = 0;
  while (formData[`receiver[${i}][name]`]) {
    receivers.push({
      name: formData[`receiver[${i}][name]`],
      phoneNumber: formData[`receiver[${i}][phoneNumber]`] || undefined,
      email: formData[`receiver[${i}][email]`] || undefined
    });
    i++;
  }
  transformed.receiver = receivers;

  return transformed;
}


module.exports = CommunicationController;