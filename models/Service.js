const { Schema, model } = require('mongoose');

const serviceSchema = new Schema({
  staffId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  inService: { type: Boolean, default: true },
  day: { type: String }, // Format par exemple "15/04/2025"
  totalTime: { type: Number, default: 0 } // Durée cumulée en millisecondes
});

module.exports = model('Service', serviceSchema);
