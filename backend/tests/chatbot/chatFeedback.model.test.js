const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ChatFeedback = require('../../model/ChatFeedback');

let mongo;

describe('ChatFeedback model', () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('persists feedback', async () => {
    const f = await ChatFeedback.create({
      sessionId: 's1',
      messageId: new mongoose.Types.ObjectId(),
      rating: 'up'
    });
    expect(f.rating).toBe('up');
  });

  it('rejects invalid rating', async () => {
    await expect(ChatFeedback.create({
      sessionId: 's2',
      messageId: new mongoose.Types.ObjectId(),
      rating: 'sideways'
    })).rejects.toThrow();
  });
});
