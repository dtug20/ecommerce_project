const { parseFlags } = require('../../scripts/lib/db');

describe('parseFlags', () => {
  it('defaults to dry-run (commit false)', () => {
    expect(parseFlags([])).toMatchObject({ commit: false, dryRun: true });
  });
  it('--commit enables writes', () => {
    expect(parseFlags(['--commit'])).toMatchObject({ commit: true, dryRun: false });
  });
  it('captures --yes and positional timestamp', () => {
    const f = parseFlags(['--commit', '--yes', '2026-05-29T00-00-00']);
    expect(f.yes).toBe(true);
    expect(f.positional).toContain('2026-05-29T00-00-00');
  });
});
