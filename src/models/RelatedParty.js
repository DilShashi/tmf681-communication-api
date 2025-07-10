const mongoose = require('mongoose');

const RelatedPartySchema = new mongoose.Schema({
  href: {
    type: String,
    description: "Hyperlink reference"
  },
  id: {
    type: String,
    required: true,
    description: "unique identifier"
  },
  name: {
    type: String,
    description: "Name of the related entity"
  },
  role: {
    type: String,
    description: "Role played by the related party"
  },
  partyOrPartyRole: {
    type: mongoose.Schema.Types.Mixed,
    description: "The actual type of the target instance when needed for disambiguation"
  },
  "@baseType": {
    type: String,
    description: "When sub-classing, this defines the super-class"
  },
  "@referredType": {
    type: String,
    description: "The actual type of the target instance when needed for disambiguation"
  },
  "@schemaLocation": {
    type: String,
    description: "A URI to a JSON-Schema file that defines additional attributes and relationships"
  },
  "@type": {
    type: String,
    default: "RelatedParty"
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('RelatedParty', RelatedPartySchema);