const CommunicationMessage = require('../models/CommunicationMessage');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

class RetryService {
  // Default retry configuration
  static get defaultConfig() {
    return {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      delayMultiplier: 2
    };
  }

  // Send a message with retry logic
  static async sendWithRetry(message, config = {}) {
    const { maxRetries, initialDelay, delayMultiplier } = { ...this.defaultConfig, ...config };
    let attempt = 0;
    let delay = initialDelay;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        logger.info(`Attempt ${attempt} to send message ${message.id}`);
        
        // Simulate sending the message (replace with actual sending logic)
        const success = await this.sendMessage(message);
        
        if (success) {
          // Update message state to completed
          message.state = 'completed';
          message.sendTimeComplete = new Date();
          await message.save();
          
          // Publish state change event
          await notificationService.publishStateChange(message, 'completed');
          
          // Send delivery confirmation
          await notificationService.sendNotification(message, 'completed');
          
          return true;
        }
      } catch (error) {
        logger.error(`Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Calculate next delay with exponential backoff
          delay *= delayMultiplier;
          logger.info(`Waiting ${delay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All attempts failed
    logger.error(`Failed to send message ${message.id} after ${maxRetries} attempts`);
    throw new Error(`Failed after ${maxRetries} attempts`);
  }

  // Simulate sending a message (replace with actual implementation)
  static async sendMessage(message) {
    // Simulate random failures for testing
    if (Math.random() < 0.3) { // 30% chance of failure
      throw new Error('Simulated network error');
    }
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }
}

module.exports = RetryService;