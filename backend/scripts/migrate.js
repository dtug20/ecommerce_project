'use strict';
const path = require('path');
const { connect, disconnect, parseFlags } = require('./lib/db');
const { runBackup, tsNow } = require('./backup');
const { importBrands } = require('./import-brands');
const { importCategories } = require('./import-categories');
const { fixExisting } = require('./fix-existing');
const { importNew } = require('./import-new');
const { resyncAggregates } = require('./resync-aggregates');
const { runChecks } = require('./verify');

async function runMigration({ commit = false, backupDir = path.join(__dirname, '..', 'backups'), selection, catalogById, translateFn, processImagesFn, djBrandNames } = {}) {
  const manifestPath = path.join(__dirname, 'data', 'image-manifest.json');
  const translationsPath = path.join(__dirname, 'data', 'translations.cache.json');
  const steps = {};

  if (commit) steps.backup = await runBackup({ dir: backupDir, timestamp: tsNow(), allowEmpty: true });
  else steps.backup = '[dry-run] skipped';

  const djNames = djBrandNames || [...new Set(require('./data/dummyjson-catalog.json').map((p) => p.brand).filter(Boolean))];
  steps.brands = await importBrands({ djBrandNames: djNames, commit });
  steps.categories = await importCategories({ commit });
  steps.fixed = await fixExisting({ commit, translateFn, processImagesFn, manifestPath, translationsPath, catalog: catalogById ? [...catalogById.values()] : undefined });
  steps.imported = await importNew({ commit, selection, catalogById, translateFn, processImagesFn, manifestPath, translationsPath });
  steps.resync = await resyncAggregates({ commit });
  steps.verify = await runChecks();
  return steps;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    console.log(flags.commit ? '=== COMMIT RUN ===' : '=== DRY RUN (no writes) ===');
    const r = await runMigration({ commit: flags.commit });
    console.log(JSON.stringify({ backup: r.backup && r.backup.outDir, brands: r.brands, categories: r.categories, fixed: r.fixed, imported: r.imported, resync: r.resync, verifyCounts: r.verify.counts, verifyPass: r.verify.pass }, null, 1));
    if (!r.verify.pass) console.error('VERIFY FAILURES:\n' + r.verify.failures.map((f) => ' - ' + f).join('\n'));
    await disconnect();
    process.exit(r.verify.pass ? 0 : 1);
  })().catch((e) => { console.error('MIGRATE FAILED:', e.message); process.exit(1); });
}

module.exports = { runMigration };
