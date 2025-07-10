// src/models/Receiver.js
const mongoose = require('mongoose');

const ReceiverSchema = new mongoose.Schema({
  appUserId: {
    type: String,
    description: "ID of the mobile app user"
  },
  email: {
    type: String,
    description: "Receiver address of email, if the communication type is email"
  },
  id: {
    type: String,
    description: "ID of the receiver"
  },
  ip: {
    type: String,
    description: "IP address of the receiver"
  },
  name: {
    type: String,
    description: "Name of the receiver"
  },
  party: {
    type: mongoose.Schema.Types.Mixed, // Changed from ObjectId ref to Mixed
    description: "Related Entity reference"
  },
  phoneNumber: {
    type: String,
    description: "Phone number of the receiver, if the communication type is SMS"
  },
  "@type": {
    type: String,
    default: "Receiver"
  }
}, {
  timestamps: true,
  strict: false
});

// Add pre-save hook to generate ID if not provided
ReceiverSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = new mongoose.Types.ObjectId().toString();
  }
  next();
});

module.exports = mongoose.model('Receiver', ReceiverSchema);