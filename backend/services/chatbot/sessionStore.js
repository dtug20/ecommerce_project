const ChatSession = require('../../model/ChatSession');

/**
 * Get an existing session or create a new one.
 * Also updates userId/locale if they've changed since the session was created.
 */
async function getOrCreate({ sessionId, userId = null, anonId = null, locale = 'en' }) {
  let session = await ChatSession.findOne({ sessionId });
  if (!session) {
    session = await ChatSession.create({ sessionId, userId, anonId, locale });
  } else {
    let dirty = false;
    if (userId && !session.userId) {
      session.userId = userId;
      dirty = true;
    }
    if (locale && session.locale !== locale) {
      session.locale = locale;
      dirty = true;
    }
    if (dirty) await session.save();
  }
  return session;
}

/**
 * Convert the last `window` user/assistant messages into Gemini's
 * [{role:'user'|'model', parts:[{text}]}] format.
 * System and tool messages are excluded — they are not part of the
 * user-facing turn history that the Gemini SDK expects.
 */
function buildGeminiHistory(session, window) {
  return session.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-window)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
}

/**
 * Append a single message object to the session and persist.
 * Returns the saved subdocument.
 */
async function appendMessage(session, message) {
  session.messages.push(message);
  await session.save();
  return session.messages[session.messages.length - 1];
}

/**
 * Mark a session as ended.
 */
async function endSession(sessionId) {
  await ChatSession.updateOne({ sessionId }, { status: 'ended', endedAt: new Date() });
}

module.exports = { getOrCreate, buildGeminiHistory, appendMessage, endSession };
