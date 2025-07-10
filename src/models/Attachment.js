// src/models/Attachment.js
const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  attachmentType: {
    type: String,
    description: "Attachment type such as video, picture"
  },
  content: {
    type: String,
    description: "The actual contents of the attachment object, if embedded, encoded as base64"
  },
  description: {
    type: String,
    description: "A narrative text describing the content of the attachment"
  },
  href: {
    type: String,
    description: "URI for this Attachment"
  },
  id: {
    type: String,
    description: "Unique identifier for this particular attachment",
    default: () => new mongoose.Types.ObjectId().toString() // Auto-generate ID if not provided
  },
  mimeType: {
    type: String,
    description: "Attachment mime type such as extension file for video, picture and document"
  },
  name: {
    type: String,
    description: "The name of the attachment"
  },
  size: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quantity',
    description: "The size of the attachment"
  },
  url: {
    type: String,
    description: "Uniform Resource Locator, is a web page address (a subset of URI)"
  },
  validFor: {
    type: Date,
    description: "The period of time for which the attachment is valid"
  },
  "@type": {
    type: String,
    default: "Attachment"
  }
}, {
  timestamps: true,
  strict: false // To allow polymorphic extensions
});

// Add pre-save hook to ensure href is set
AttachmentSchema.pre('save', function(next) {
  if (!this.href) {
    this.href = `${process.env.API_BASE_URL || 'http://localhost:8080'}/tmf-api/communicationManagement/v4/attachment/${this.id}`;
  }
  next();
});

module.exports = mongoose.model('Attachment', AttachmentSchema);