const logger = require('../utils/logger');

// Valid state transitions
const stateTransitions = {
  initial: ['inProgress', 'cancelled'],
  inProgress: ['completed', 'failed', 'cancelled'],
  completed: [],
  cancelled: [],
  failed: ['inProgress']
};

class StateMachineService {
  // Check if a state transition is valid
  static isValidTransition(currentState, newState) {
    if (!stateTransitions[currentState]) {
      logger.error(`Invalid current state: ${currentState}`);
      return false;
    }
    
    const isValid = stateTransitions[currentState].includes(newState);
    if (!isValid) {
      logger.warn(`Invalid state transition from ${currentState} to ${newState}`);
    }
    
    return isValid;
  }

  // Get all valid next states for a given current state
  static getValidNextStates(currentState) {
    if (!stateTransitions[currentState]) {
      logger.error(`Invalid current state: ${currentState}`);
      return [];
    }
    
    return [...stateTransitions[currentState]];
  }

  // Transition a message to a new state (with validation)
  static async transitionMessage(message, newState) {
    if (!this.isValidTransition(message.state, newState)) {
      throw new Error(`Invalid state transition from ${message.state} to ${newState}`);
    }
    
    const originalState = message.state;
    message.state = newState;
    
    // Update timestamps for certain state transitions
    if (newState === 'inProgress') {
      message.sendTime = new Date();
    } else if (newState === 'completed') {
      message.sendTimeComplete = new Date();
    }
    
    await message.save();
    logger.info(`Transitioned message ${message.id} from ${originalState} to ${newState}`);
    
    return message;
  }
}

module.exports = StateMachineService;
