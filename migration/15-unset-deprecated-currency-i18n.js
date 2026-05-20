// migration/15-unset-deprecated-currency-i18n.js
// One-shot: drop deprecated SiteSetting fields after Phase 4 multi-currency landing.
// Removes payment.currency, payment.currencySymbol, i18n.defaultLanguage,
// i18n.supportedLanguages, and the now-empty i18n subdoc.
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI not set (looked in backend/.env)');
  }
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.collection('sitesettings').updateMany(
    {},
    {
      $unset: {
        'payment.currency': '',
        'payment.currencySymbol': '',
        i18n: '',
      },
    },
  );
  console.log('Updated', result.modifiedCount, 'settings docs');
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
