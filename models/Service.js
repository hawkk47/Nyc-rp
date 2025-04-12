const { Schema, model } = require('mongoose');

const serviceSchema = new Schema({
  staffId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  inService: { type: Boolean, default: true },
  day: { type: String } // On peut stocker la date du jour par exemple en format locale
});

module.exports = model('Service', serviceSchema);
