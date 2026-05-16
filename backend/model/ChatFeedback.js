const mongoose = require('mongoose');

const ChatFeedbackSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  messageId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rating: { type: String, enum: ['up', 'down'], required: true },
  reason: { type: String, default: null, maxlength: 500 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

ChatFeedbackSchema.index({ sessionId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('ChatFeedback', ChatFeedbackSchema);
