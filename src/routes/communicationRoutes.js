// src/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const CommunicationController = require('../controllers/CommunicationController');
const ViewController = require('../controllers/ViewController');

// UI Routes (only for root path)
router.get('/', ViewController.getApiHome);
router.get('/create', ViewController.getMessageForm);
router.get('/messages', ViewController.listMessagesUI);
router.get('/messages/:id', ViewController.getMessageUI);

// API Routes
router.get('/communicationMessage', (req, res, next) => {
  req.query.fields = req.query.fields || '';
  req.query.offset = req.query.offset || 0;
  req.query.limit = req.query.limit || 100;
  next();
}, CommunicationController.listMessages);

router.get('/communicationMessage/:id', CommunicationController.getMessage);
router.post('/communicationMessage', 
  express.urlencoded({ extended: true }),
  CommunicationController.createMessage);
router.patch('/communicationMessage/:id', CommunicationController.updateMessage);
router.delete('/communicationMessage/:id', CommunicationController.deleteMessage);

module.exports = router;