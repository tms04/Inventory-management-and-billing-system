const mongoose = require('mongoose');

const creditNoteItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    default: ''
  }
});

const creditNoteSchema = new mongoose.Schema({
  creditNoteNumber: {
    type: String,
    required: true,
    unique: true
  },
  originalBillNumber: {
    type: String,
    required: true
  },
  originalBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  items: [creditNoteItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalProfitLoss: {
    type: Number,
    required: true,
    default: 0
  },
  reason: {
    type: String,
    default: ''
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

creditNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CreditNote', creditNoteSchema);
