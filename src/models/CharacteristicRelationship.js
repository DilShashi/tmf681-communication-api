// src/models/CharacteristicRelationship.js
const mongoose = require('mongoose');

const CharacteristicRelationshipSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
    description: "Unique identifier of the characteristic relationship"
  },
  relationshipType: {
    type: String,
    required: true,
    description: "The type of relationship"
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
    default: "CharacteristicRelationship"
  }
}, {
  timestamps: true,
  strict: false
});

// Add pre-save hook to ensure href is set if needed
CharacteristicRelationshipSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('CharacteristicRelationship', CharacteristicRelationshipSchema);