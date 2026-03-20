'use strict';

const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'rejected'],
      default: 'pending',
    },
    bankDetails: { type: mongoose.Schema.Types.Mixed },
    transactionRef: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { timestamps: true }
);

payoutSchema.index({ vendor: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ requestedAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
