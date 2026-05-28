const { createLogger } = require('../../scripts/lib/log');

describe('createLogger', () => {
  it('buffers lines and prefixes level + step', () => {
    const out = [];
    const log = createLogger({ sink: (l) => out.push(l) });
    log.info('start', { n: 1 });
    log.warn('careful');
    expect(out[0]).toMatch(/INFO .*start.*"n":1/);
    expect(out[1]).toMatch(/WARN .*careful/);
    expect(log.lines().length).toBe(2);
  });
});
