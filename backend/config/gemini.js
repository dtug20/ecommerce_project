const required = ['GEMINI_API_KEY'];
required.forEach((k) => {
  if (!process.env[k]) {
    console.warn(`[chatbot] Missing env: ${k}. Chatbot will be disabled.`);
  }
});

module.exports = {
  apiKey: process.env.GEMINI_API_KEY || '',
  chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash',
  embedModel: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
  enabled: process.env.CHATBOT_ENABLED !== 'false' && !!process.env.GEMINI_API_KEY,
  rateLimitPer5Min: parseInt(process.env.CHATBOT_RATE_LIMIT_PER_USER_PER_5MIN || '20', 10),
  maxMessageChars: parseInt(process.env.CHATBOT_MAX_MESSAGE_CHARS || '2000', 10),
  historyWindow: parseInt(process.env.CHATBOT_HISTORY_WINDOW || '12', 10),
  maxToolCallsPerTurn: parseInt(process.env.CHATBOT_MAX_TOOL_CALLS_PER_TURN || '5', 10)
};
