const mongoose = require('mongoose');

const SenderSchema = new mongoose.Schema({
  email: {
    type: String,
    description: "Sender address of email, if the communication type is email"
  },
  id: {
    type: String,
    description: "ID of the sender"  // Removed required: true
  },
  name: {
    type: String,
    description: "Name of the sender"
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RelatedParty',
    description: "Related Entity reference"
  },
  phoneNumber: {
    type: String,
    description: "Phone number of the sender, if the communication type is SMS"
  },
  "@type": {
    type: String,
    default: "Sender"
  }
}, {
  timestamps: true,
  strict: false
});

// Add pre-save hook to generate ID if not provided
SenderSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString();
  }
  next();
});

module.exports = mongoose.model('Sender', SenderSchema);
