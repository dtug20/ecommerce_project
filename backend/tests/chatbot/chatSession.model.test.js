const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ChatSession = require('../../model/ChatSession');

let mongo;

describe('ChatSession model', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  beforeEach(async () => {
    await ChatSession.deleteMany({});
  });

  it('persists a session with messages and computes defaults', async () => {
    const s = await ChatSession.create({
      sessionId: 'abc-123',
      locale: 'en',
      messages: [{ role: 'user', content: 'hi' }]
    });
    expect(s.status).toBe('active');
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0].createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid role', async () => {
    await expect(ChatSession.create({
      sessionId: 'abc-124',
      locale: 'en',
      messages: [{ role: 'bogus', content: 'x' }]
    })).rejects.toThrow();
  });
});
