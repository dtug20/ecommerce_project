jest.mock('../../services/chatbot/llmProvider', () => ({
  embed: jest.fn().mockResolvedValue(new Array(768).fill(0.1))
}));
const llm = require('../../services/chatbot/llmProvider');
const emb = require('../../services/chatbot/embeddings');

describe('embeddings', () => {
  it('builds product embedding text and embeds it', async () => {
    const product = {
      title: 'Red Shoes',
      productType: 'fashion',
      parent: 'Footwear',
      brand: { name: 'Nike' },
      tags: ['running', 'red'],
      description: 'Comfortable running shoes'
    };
    const v = await emb.embedProduct(product);
    expect(v).toHaveLength(768);
    expect(llm.embed).toHaveBeenCalled();
    expect(llm.embed.mock.calls[0][0]).toContain('Red Shoes');
    expect(llm.embed.mock.calls[0][0]).toContain('Nike');
  });
});
