'use strict';

// Mock the LLM provider so the test never touches Google's API
jest.mock('../../services/chatbot/llmProvider', () => ({
  streamChat: jest.fn().mockResolvedValue({
    text: 'Here are some shoes.',
    toolCalls: [],
    usage: { promptTokenCount: 10, candidatesTokenCount: 5 }
  }),
  embed: jest.fn()
}));

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongo;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = 'test';
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  // Require app after env vars are set so connectDB() picks up the in-memory URI
  app = require('../../index');
  // Wait for mongoose to reach connected state
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('connected', resolve));
  }
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
});

describe('POST /api/v1/store/chat/message', () => {
  it('accepts a message and returns a response', async () => {
    const r = await request(app)
      .post('/api/v1/store/chat/message')
      .send({ sessionId: 'sess-abc-12345678', message: 'hello' });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.data.text).toBe('Here are some shoes.');
  });

  it('rejects empty message', async () => {
    const r = await request(app)
      .post('/api/v1/store/chat/message')
      .send({ sessionId: 'sess-abc-12345678', message: '' });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects missing sessionId', async () => {
    const r = await request(app)
      .post('/api/v1/store/chat/message')
      .send({ message: 'hello' });
    expect(r.status).toBe(422);
  });
});

describe('POST /api/v1/store/chat/feedback', () => {
  it('records feedback for a message', async () => {
    const r = await request(app)
      .post('/api/v1/store/chat/feedback')
      .send({
        sessionId: 'sess-abc-12345678',
        messageId: new mongoose.Types.ObjectId().toString(),
        rating: 'up'
      });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.data.feedback.rating).toBe('up');
  });

  it('rejects invalid rating', async () => {
    const r = await request(app)
      .post('/api/v1/store/chat/feedback')
      .send({
        sessionId: 'sess-abc-12345678',
        messageId: new mongoose.Types.ObjectId().toString(),
        rating: 'meh'
      });
    expect(r.status).toBe(422);
  });
});
