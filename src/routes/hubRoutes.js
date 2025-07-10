const express = require('express');
const router = express.Router();
const HubController = require('../controllers/HubController');

// Register a new listener
router.post('/', HubController.registerListener);

// Unregister a listener
router.delete('/:id', HubController.unregisterListener);

module.exports = router;