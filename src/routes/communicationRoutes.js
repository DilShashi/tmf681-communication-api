// src/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const CommunicationController = require('../controllers/CommunicationController');
const ViewController = require('../controllers/ViewController');

// UI Routes
router.get('/', ViewController.getApiHome);
router.get('/create', ViewController.getMessageForm);
router.get('/messages', ViewController.listMessagesUI);
router.get('/messages/:id', ViewController.getMessageUI);

// API Routes
router.get('/', (req, res, next) => {
  req.query.fields = req.query.fields || '';
  req.query.offset = req.query.offset || 0;
  req.query.limit = req.query.limit || 100;
  CommunicationController.listMessages(req, res, next);
});

router.get('/:id', CommunicationController.getMessage);
router.post('/', CommunicationController.createMessage);
router.patch('/:id', CommunicationController.updateMessage);
router.delete('/:id', CommunicationController.deleteMessage);

module.exports = router;