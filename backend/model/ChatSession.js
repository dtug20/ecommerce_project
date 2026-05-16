const mongoose = require('mongoose');

const SuggestedActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['add_to_cart', 'apply_coupon', 'view_product', 'view_order', 'sign_in'],
    required: true
  },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  label: { type: String, required: true }
}, { _id: false });

const ToolCallSchema = new mongoose.Schema({
  toolName: { type: String, required: true },
  args: { type: mongoose.Schema.Types.Mixed, default: {} },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  error: { type: String, default: null },
  durationMs: { type: Number, default: 0 }
}, { _id: false });

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'tool', 'system'], required: true },
  content: { type: String, default: '' },
  toolCalls: { type: [ToolCallSchema], default: [] },
  suggestedActions: { type: [SuggestedActionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  tokensIn: { type: Number, default: 0 },
  tokensOut: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 }
});

const ChatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  anonId: { type: String, default: null, index: true },
  locale: { type: String, enum: ['en', 'vi'], default: 'en' },
  messages: { type: [ChatMessageSchema], default: [] },
  context: {
    cartSnapshot: { type: Array, default: [] },
    recentlyViewedProducts: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    appliedCouponCode: { type: String, default: null }
  },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });
ChatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
