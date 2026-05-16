const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ChatSession = require('../../model/ChatSession');
const store = require('../../services/chatbot/sessionStore');

let mongo;

describe('sessionStore', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  beforeEach(async () => { await ChatSession.deleteMany({}); });

  it('creates a session on first message', async () => {
    const s = await store.getOrCreate({ sessionId: 'new', locale: 'en' });
    expect(s.sessionId).toBe('new');
    expect(s.messages).toEqual([]);
  });

  it('returns sliding-window history', async () => {
    const s = await store.getOrCreate({ sessionId: 'x', locale: 'en' });
    for (let i = 0; i < 20; i++) {
      s.messages.push({ role: 'user', content: `m${i}` });
    }
    await s.save();
    const hist = store.buildGeminiHistory(s, 12);
    expect(hist).toHaveLength(12);
    expect(hist[0].parts[0].text).toBe('m8');
  });
});
