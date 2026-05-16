const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/gemini');

let client = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY || config.apiKey;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// Token bucket: 14 req/min headroom under 15/min Gemini free-tier limit
const REQUESTS_PER_MINUTE = 14;
let tokens = REQUESTS_PER_MINUTE;
let lastRefill = Date.now();
function refill() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const refillAmount = (elapsed / 60_000) * REQUESTS_PER_MINUTE;
  tokens = Math.min(REQUESTS_PER_MINUTE, tokens + refillAmount);
  lastRefill = now;
}
async function takeToken() {
  refill();
  while (tokens < 1) {
    await new Promise((r) => setTimeout(r, 1000));
    refill();
  }
  tokens -= 1;
}

async function streamChat({ systemInstruction, history, userMessage, tools, onToken, onToolCall }) {
  await takeToken();
  const model = getClient().getGenerativeModel({
    model: config.chatModel,
    systemInstruction,
    tools: tools && tools.length ? [{ functionDeclarations: tools }] : undefined,
    generationConfig: { temperature: 0.4 }
  });

  const chat = model.startChat({ history });
  let attempt = 0;
  let lastErr;
  while (attempt < 3) {
    try {
      const result = await chat.sendMessageStream(userMessage);
      const toolCalls = [];
      let text = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text() || '';
        if (chunkText) {
          text += chunkText;
          if (onToken) onToken(chunkText);
        }
        const calls = (chunk.functionCalls && chunk.functionCalls()) || [];
        for (const c of calls) {
          toolCalls.push(c);
          if (onToolCall) onToolCall(c);
        }
      }
      const final = await result.response;
      return {
        text,
        toolCalls,
        usage: final.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 }
      };
    } catch (e) {
      lastErr = e;
      attempt += 1;
      if (e.status === 429 || (e.message && e.message.includes('429'))) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      } else {
        break;
      }
    }
  }
  throw lastErr;
}

async function embed(text) {
  const model = getClient().getGenerativeModel({ model: config.embedModel });
  const res = await model.embedContent(text);
  return res.embedding.values;
}

module.exports = { streamChat, embed, _internal: { refill, getTokens: () => tokens } };
