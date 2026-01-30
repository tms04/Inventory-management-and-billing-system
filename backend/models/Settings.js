const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: {
    type: String,
    default: 'Ramya Goyam Upakaran',
    required: true
  },
  lastBillNumber: {
    type: Number,
    default: 0
  },
  lastCreditNoteNumber: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
