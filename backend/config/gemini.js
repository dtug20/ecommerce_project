if (process.env.NODE_ENV !== 'test') {
  const required = ['GEMINI_API_KEY'];
  required.forEach((k) => {
    if (!process.env[k]) {
      console.warn(`[chatbot] Missing env: ${k}. Chatbot will be disabled.`);
    }
  });
}

module.exports = {
  apiKey: process.env.GEMINI_API_KEY || '',
  chatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash-lite',
  embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
  enabled: process.env.CHATBOT_ENABLED !== 'false' && !!process.env.GEMINI_API_KEY,
  rateLimitPer5Min: parseInt(process.env.CHATBOT_RATE_LIMIT_PER_USER_PER_5MIN, 10) || 20,
  maxMessageChars: parseInt(process.env.CHATBOT_MAX_MESSAGE_CHARS, 10) || 2000,
  historyWindow: parseInt(process.env.CHATBOT_HISTORY_WINDOW, 10) || 12,
  maxToolCallsPerTurn: parseInt(process.env.CHATBOT_MAX_TOOL_CALLS_PER_TURN, 10) || 3
};
