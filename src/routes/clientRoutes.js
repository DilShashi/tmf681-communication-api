// src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const HubController = require('../controllers/HubController');

// TM Forum compliant listener endpoints
router.post('/communicationMessageAttributeValueChangeEvent', 
  HubController.handleAttributeChangeEvent);
  
// Updated path to exactly match specification
router.post('/communicationMessageStateChangeEvent', 
  HubController.handleStateChangeEvent);

// Generic listener endpoint (fallback)
router.post('/', HubController.handleEventNotification);

module.exports = router;