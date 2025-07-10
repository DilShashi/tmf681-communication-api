module.exports = {
  // Enum for CommunicationMessage state types
  INITIAL: 'initial',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',

  // Get all valid states
  getAllStates() {
    return [
      this.INITIAL,
      this.IN_PROGRESS,
      this.COMPLETED,
      this.CANCELLED,
      this.FAILED
    ];
  },

  // Check if a state is valid
  isValidState(state) {
    return this.getAllStates().includes(state);
  },

  // Get valid transitions for a state
  getValidTransitions(currentState) {
    const transitions = {
      [this.INITIAL]: [this.IN_PROGRESS, this.CANCELLED],
      [this.IN_PROGRESS]: [this.COMPLETED, this.FAILED, this.CANCELLED],
      [this.COMPLETED]: [],
      [this.CANCELLED]: [],
      [this.FAILED]: [this.IN_PROGRESS]
    };

    return transitions[currentState] || [];
  },

  // Check if a transition is valid
  isValidTransition(currentState, newState) {
    const validTransitions = this.getValidTransitions(currentState);
    return validTransitions.includes(newState);
  }
};