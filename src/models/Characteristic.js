// src/models/Characteristic.js
const mongoose = require('mongoose');

const CharacteristicSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
    description: "Unique identifier of the characteristic"
  },
  name: {
    type: String,
    required: true,
    description: "Name of the characteristic"
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    description: "The value of the characteristic"
  },
  valueType: {
    type: String,
    description: "Data type of the value of the characteristic"
  },
  characteristicRelationship: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CharacteristicRelationship',
    description: "Another Characteristic that is related to the current Characteristic"
  }],
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
    default: "Characteristic"
  }
}, {
  timestamps: true,
  strict: false
});

// Add pre-save hook to ensure href is set if needed
CharacteristicSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Characteristic', CharacteristicSchema);