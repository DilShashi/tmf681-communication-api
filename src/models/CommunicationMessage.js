// src/models/CommunicationMessage.js
const mongoose = require('mongoose');
const URIHandler = require('../utils/uriHandler');

const CommunicationMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    description: "The content of the communication message"
  },
  description: {
    type: String,
    description: "Description for the whole object"
  },
  href: {
    type: String,
    description: "Hypertext Reference of the Communication Message",
    index: true
  },
  id: {
    type: String,
    description: "Unique identifier of Communication Message",
    unique: true,
    index: true
  },
  logFlag: {
    type: Boolean,
    default: false,
    description: "Flag indicating if message should be logged"
  },
  messageType: {
    type: String,
    required: true,
    enum: ['SMS', 'Email', 'MobileAppPush'],
    description: "The type of message"
  },
  priority: {
    type: String,
    description: "The priority of the communication message"
  },
  scheduledSendTime: {
    type: Date,
    description: "The scheduled time for sending the communication message",
    index: true
  },
  sendTime: {
    type: Date,
    description: "The time of sending communication message"
  },
  sendTimeComplete: {
    type: Date,
    description: "The time of completion of sending communication message"
  },
  state: {
    type: String,
    enum: ['initial', 'inProgress', 'completed', 'cancelled', 'failed'],
    default: 'initial',
    description: "Status of communication message",
    index: true
  },
  subject: {
    type: String,
    description: "The title of the message"
  },
  tryTimes: {
    type: Number,
    default: 1,
    description: "How many times to retry the delivery of this message"
  },
  attachment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment',
    description: "Any attachment associated with this message"
  }],
  characteristic: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Characteristic',
    description: "Any additional characteristic(s) of this message"
  }],
  receiver: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Receiver',
    required: true,
    description: "The receiver(s) of this message"
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sender',
    required: true,
    description: "The sender of this message"
  },
  "@baseType": {
    type: String,
    description: "When sub-classing, this defines the super-class"
  },
  "@schemaLocation": {
    type: String,
    description: "A URI to a JSON-Schema file that defines additional attributes and relationships"
  },
  "@type": {
    type: String,
    default: "CommunicationMessage"
  }
}, {
  timestamps: true,
  strict: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook to ensure ID and href are set
CommunicationMessageSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  if (!this.href) {
    this.href = URIHandler.generateHref('communicationMessage', this.id);
  }
  next();
});

// Static method for finding by either _id or id field
CommunicationMessageSchema.statics.findByIdOrId = function(id) {
  return this.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
      { id: id }
    ]
  });
};

// Removed duplicate index definitions - keeping only the schema-level indexes

module.exports = mongoose.model('CommunicationMessage', CommunicationMessageSchema);