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
      const validationErrors = Validator.validateCommunicationMessage(req.body);
      if (validationErrors) {
        return res.status(400).json(
          TMFErrorHandler.createTMFError(400, 'Validation failed', validationErrors)
        );
      }

      const attachments = req.body.attachment && req.body.attachment.length > 0 
        ? await Promise.all(
            req.body.attachment.map(async attachmentData => {
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

      const characteristics = req.body.characteristic && req.body.characteristic.length > 0
        ? await Promise.all(
            req.body.characteristic.map(async charData => {
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

      const receivers = await Promise.all(
        req.body.receiver.map(async receiverData => {
          const receiver = new Receiver({
            ...receiverData,
            "@type": "Receiver"
          });
          const savedReceiver = await receiver.save();
          return savedReceiver._id;
        })
      );

      const sender = new Sender({
        ...req.body.sender,
        "@type": "Sender"
      });
      const savedSender = await sender.save();

      const newMessage = new CommunicationMessage({
        ...req.body,
        attachment: attachments,
        characteristic: characteristics,
        receiver: receivers,
        sender: savedSender._id,
        "@type": "CommunicationMessage",
        state: req.body.state || 'initial',
        logFlag: req.body.logFlag || false,
        tryTimes: req.body.tryTimes || 1
      });

      const savedMessage = await newMessage.save();
      
      if (!savedMessage.href) {
        savedMessage.href = `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${savedMessage.id}`;
        await savedMessage.save();
      }
      
      await publishStateChangeEvent(savedMessage, 'initial');
      
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

      res.status(201).json({
        ...populatedMessage,
        href: populatedMessage.href || `${config.api.baseUrl}${config.api.basePath}/communicationMessage/${populatedMessage.id}`
      });
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

module.exports = CommunicationController;