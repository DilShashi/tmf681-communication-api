// src/controllers/ViewController.js
const path = require('path');
const fs = require('fs');
const config = require('../config/tmf-config');
const CommunicationMessage = require('../models/CommunicationMessage');

class ViewController {
  static async getApiHome(req, res) {
    try {
      const htmlPath = path.join(__dirname, '../views/api-home.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      const sampleMessages = await CommunicationMessage.find()
        .limit(3)
        .sort({ createdAt: -1 })
        .lean();
      
      html = html
        .replace(/{{API_BASE_PATH}}/g, config.api.basePath)
        .replace(/{{API_VERSION}}/g, config.api.version)
        .replace(/{{API_TITLE}}/g, config.api.title)
        .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
        .replace('"{{SAMPLE_MESSAGES}}"', JSON.stringify(sampleMessages));
      
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: "Could not load API homepage",
        timestamp: new Date().toISOString()
      });
    }
  }

  static async listMessagesUI(req, res) {
    try {
      const messages = await CommunicationMessage.find()
        .sort({ createdAt: -1 })
        .lean();
      
      const htmlPath = path.join(__dirname, '../views/message-list.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      html = html
        .replace(/{{API_BASE_PATH}}/g, config.api.basePath)
        .replace('"{{MESSAGES}}"', JSON.stringify(messages));
      
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      console.error('Error loading messages:', err);
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: "Could not load messages",
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getMessageUI(req, res) {
    try {
      const message = await CommunicationMessage.findById(req.params.id).lean();
      if (!message) {
        return res.status(404).send('Message not found');
      }
      
      const htmlPath = path.join(__dirname, '../views/message-detail.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      html = html
        .replace(/{{API_BASE_PATH}}/g, config.api.basePath)
        .replace('"{{MESSAGE}}"', JSON.stringify(message));
      
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: "Could not load message",
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getMessageForm(req, res) {
    try {
      const formPath = path.join(__dirname, '../views/message-form.html');
      let html = fs.readFileSync(formPath, 'utf8');
      
      html = html
        .replace(/{{API_BASE_PATH}}/g, config.api.basePath)
        .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
      
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      res.status(500).json({
        code: 500,
        reason: "Internal Server Error",
        message: "Could not load message form",
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = ViewController;