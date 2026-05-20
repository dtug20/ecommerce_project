'use strict';

// CJS shim for the pure-ESM dateformat package.
// Jest cannot transform ESM packages by default; this mock replaces it
// so the test suite (which does not exercise VNPay) can load index.js.

function dateFormat(date, mask) {
  if (!date) date = new Date();
  if (!(date instanceof Date)) date = new Date(date);
  return date.toISOString();
}

dateFormat.masks = {
  default: "ddd mmm dd yyyy HH:MM:ss",
};

module.exports = dateFormat;
module.exports.default = dateFormat;
