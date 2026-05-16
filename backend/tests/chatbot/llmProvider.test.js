jest.mock('@google/generative-ai', () => {
  const sendMessageStream = jest.fn().mockResolvedValue({
    stream: (async function* () {
      yield { text: () => 'hello', functionCalls: () => [] };
    })(),
    response: Promise.resolve({
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      candidates: [{ content: { parts: [{ text: 'hello' }] } }]
    })
  });
  const startChat = jest.fn().mockReturnValue({ sendMessageStream });
  const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
  return { GoogleGenerativeAI: jest.fn().mockImplementation(() => ({ getGenerativeModel })) };
});

const provider = require('../../services/chatbot/llmProvider');

describe('llmProvider', () => {
  beforeAll(() => { process.env.GEMINI_API_KEY = 'test-key'; });

  it('streams text and returns usage', async () => {
    const chunks = [];
    const result = await provider.streamChat({
      systemInstruction: 'sys',
      history: [],
      userMessage: 'hi',
      tools: [],
      onToken: (t) => chunks.push(t)
    });
    expect(chunks).toContain('hello');
    expect(result.usage.promptTokenCount).toBe(10);
  });
});
