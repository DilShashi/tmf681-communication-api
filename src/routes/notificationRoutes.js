// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

// Publish a state change event
router.post('/state-change', NotificationController.publishStateChangeEvent);

// Publish an attribute value change event
router.post('/attribute-change', NotificationController.publishAttributeChangeEvent);

module.exports = router;