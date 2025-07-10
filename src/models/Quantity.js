const mongoose = require('mongoose');

const QuantitySchema = new mongoose.Schema({
  amount: {
    type: Number,
    description: "Numeric value in a given unit"
  },
  units: {
    type: String,
    description: "Unit"
  }
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Quantity', QuantitySchema);