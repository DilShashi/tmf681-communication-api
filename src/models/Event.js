const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  correlationId: {
    type: String,
    description: "The correlation id for this event"
  },
  description: {
    type: String,
    description: "An explanatory of the event"
  },
  domain: {
    type: String,
    description: "The domain of the event"
  },
  eventId: {
    type: String,
    description: "The identifier of the event",
    default: () => new mongoose.Types.ObjectId().toString()
  },
  eventTime: {
    type: Date,
    required: true,
    default: Date.now,
    description: "The time of the event"
  },
  eventType: {
    type: String,
    required: true,
    description: "The type of the event"
  },
  fieldPath: {
    type: String,
    description: "The path identifying the object field concerned by this event"
  },
  href: {
    type: String,
    description: "Reference of the event"
  },
  id: {
    type: String,
    description: "Unique identifier of the event"
  },
  priority: {
    type: String,
    description: "A priority for the event"
  },
  timeOccurred: {
    type: Date,
    description: "The time the event occurred"
  },
  title: {
    type: String,
    description: "The title of the event"
  },
  event: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: "The event payload"
  }
}, {
  timestamps: true,
  strict: false
});

EventSchema.pre('save', function(next) {
  if (!this.href) {
    const basePath = process.env.API_BASE_PATH || '/tmf-api/communicationManagement/v4';
    this.href = `${process.env.API_BASE_URL || 'http://localhost:8080'}${basePath}/event/${this._id}`;
  }
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Event', EventSchema);
