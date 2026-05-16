const { scrubPII, checkLength, checkRate, _resetRate } = require('../../services/chatbot/guardrails');

describe('guardrails', () => {
  beforeEach(() => _resetRate());

  it('scrubs phone numbers and emails', () => {
    const out = scrubPII('Call me at +1-555-123-4567 or ben@example.com');
    expect(out).not.toContain('555-123-4567');
    expect(out).not.toContain('ben@example.com');
    expect(out).toContain('[REDACTED_PHONE]');
    expect(out).toContain('[REDACTED_EMAIL]');
  });

  it('scrubs credit-card-like sequences', () => {
    const out = scrubPII('My card is 4111 1111 1111 1111');
    expect(out).toContain('[REDACTED_CARD]');
  });

  it('rejects messages over the char limit', () => {
    const r = checkLength('x'.repeat(2001), 2000);
    expect(r.ok).toBe(false);
  });

  it('rate-limits per identity', () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRate('user1', 20, 5).ok).toBe(true);
    }
    expect(checkRate('user1', 20, 5).ok).toBe(false);
    expect(checkRate('user2', 20, 5).ok).toBe(true);
  });
});
