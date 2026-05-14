const mongoose = require('mongoose');

const financeTargetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'La categorie est requise'],
    trim: true,
    maxlength: 80,
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Le montant cible est requis'],
    min: [0, 'Le montant cible ne peut pas etre negatif'],
    set: (value) => Math.round((Number(value) || 0) * 100) / 100,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'achieved', 'missed', 'paused'],
    default: 'in_progress',
    index: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

financeTargetSchema.index({ category: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('FinanceTarget', financeTargetSchema);
