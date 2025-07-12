// src/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const CommunicationController = require('../controllers/CommunicationController');

// API Routes
router.get('/', (req, res, next) => {
  req.query.fields = req.query.fields || '';
  req.query.offset = req.query.offset || 0;
  req.query.limit = req.query.limit || 100;
  next();
}, CommunicationController.listMessages);

router.get('/:id', CommunicationController.getMessage);
router.post('/', 
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' }),
  CommunicationController.createMessage);
router.patch('/:id', CommunicationController.updateMessage);
router.delete('/:id', CommunicationController.deleteMessage);

module.exports = router;