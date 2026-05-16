jest.mock('../../services/chatbot/llmProvider', () => ({
  streamChat: jest.fn()
}));
jest.mock('../../services/chatbot/tools', () => ({
  getDeclarations: jest.fn(() => []),
  dispatch: jest.fn(async (name, args) => ({ result: { name, args }, durationMs: 1 }))
}));
const llm = require('../../services/chatbot/llmProvider');
const { runTurn } = require('../../services/chatbot/agentLoop');

describe('agentLoop', () => {
  it('returns assistant text on a simple turn', async () => {
    llm.streamChat.mockResolvedValueOnce({
      text: 'hi there', toolCalls: [], usage: { promptTokenCount: 5, candidatesTokenCount: 3 }
    });
    const out = await runTurn({
      systemInstruction: 'sys', history: [], userMessage: 'hi',
      context: { isAuthenticated: false }, onToken: () => {}
    });
    expect(out.text).toBe('hi there');
    expect(out.toolCalls).toEqual([]);
  });

  it('caps tool calls at max iterations', async () => {
    llm.streamChat.mockResolvedValue({
      text: '', toolCalls: [{ name: 'searchProducts', args: { query: 'x' } }], usage: {}
    });
    const out = await runTurn({
      systemInstruction: 'sys', history: [], userMessage: 'go',
      context: { isAuthenticated: false }, onToken: () => {}, maxIterations: 2
    });
    expect(out.iterations).toBe(2);
    expect(out.cappedOut).toBe(true);
  });
});
