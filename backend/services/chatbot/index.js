const sessionStore = require('./sessionStore');
const systemPrompt = require('./systemPrompt');
const agentLoop = require('./agentLoop');
const guardrails = require('./guardrails');
const config = require('../../config/gemini');

async function handleMessage({ sessionId, userId, anonId, locale, userMessage, cartSnapshot, recentlyViewedProducts, onToken, onToolCall }) {
  if (!config.enabled) return { error: 'disabled', message: 'Assistant is currently disabled.' };

  const identity = userId ? `u:${userId}` : `a:${anonId || sessionId}`;
  const rate = guardrails.checkRate(identity, config.rateLimitPer5Min, 5);
  if (!rate.ok) return { error: 'rate_limited', retryAfter: rate.retryAfter };

  const len = guardrails.checkLength(userMessage, config.maxMessageChars);
  if (!len.ok) return { error: 'invalid_message', reason: len.reason };

  const cleanMessage = guardrails.scrubPII(userMessage);

  const session = await sessionStore.getOrCreate({ sessionId, userId, anonId, locale });
  session.context.cartSnapshot = cartSnapshot || session.context.cartSnapshot;
  session.context.recentlyViewedProducts = recentlyViewedProducts || session.context.recentlyViewedProducts;
  await session.save();

  await sessionStore.appendMessage(session, { role: 'user', content: cleanMessage });

  const sys = systemPrompt.build(locale || session.locale || 'en', {
    userId,
    cartSnapshot: session.context.cartSnapshot,
    recentlyViewedProducts: session.context.recentlyViewedProducts
  });
  const history = sessionStore.buildGeminiHistory(session, config.historyWindow);

  const turnStart = Date.now();
  let turnResult;
  try {
    turnResult = await agentLoop.runTurn({
      systemInstruction: sys,
      history,
      userMessage: cleanMessage,
      context: { userId, sessionId, locale, isAuthenticated: !!userId },
      onToken,
      onToolCall
    });
  } catch (e) {
    console.error('[chatbot] turn failed:', e);
    return { error: 'llm_error', message: "I'm having trouble right now. Please try again in a minute." };
  }

  const assistantMsg = await sessionStore.appendMessage(session, {
    role: 'assistant',
    content: turnResult.text || '',
    toolCalls: turnResult.toolCalls,
    suggestedActions: turnResult.suggestedActions,
    tokensIn: turnResult.usage.promptTokenCount || 0,
    tokensOut: turnResult.usage.candidatesTokenCount || 0,
    latencyMs: Date.now() - turnStart
  });

  // Chat traffic is already persisted on the ChatSession document
  // (messages[].tokensIn / tokensOut / latencyMs / toolCalls) and surfaced
  // by the CRM analytics endpoint, so we deliberately do NOT also write to
  // ActivityLog — its schema is for admin audit (actor/resource required)
  // and doesn't model chat turns.

  return {
    sessionId,
    messageId: assistantMsg._id,
    text: turnResult.text,
    suggestedActions: turnResult.suggestedActions,
    toolCalls: turnResult.toolCalls.map((tc) => ({ name: tc.toolName, args: tc.args }))
  };
}

module.exports = { handleMessage };
