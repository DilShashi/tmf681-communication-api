// src/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const CommunicationController = require('../controllers/CommunicationController');

// List communication messages with pagination support
router.get('/', (req, res, next) => {
  // Set default values if query params are not provided
  req.query.fields = req.query.fields || '';
  req.query.offset = req.query.offset || 0;
  req.query.limit = req.query.limit || 100;
  CommunicationController.listMessages(req, res, next);
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Retrieve a specific communication message
router.get('/:id', CommunicationController.getMessage);

// Create a new communication message
router.post('/', CommunicationController.createMessage);

// Partially update a communication message
router.patch('/:id', CommunicationController.updateMessage);

// Delete a communication message
router.delete('/:id', CommunicationController.deleteMessage);

module.exports = router;