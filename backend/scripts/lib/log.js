'use strict';
const fs = require('fs');

function createLogger({ sink = console.log, file = null } = {}) {
  const buffer = [];
  const emit = (level, msg, meta) => {
    const line = `${level} ${msg}` + (meta !== undefined ? ` ${JSON.stringify(meta)}` : '');
    buffer.push(line);
    sink(line);
    if (file) fs.appendFileSync(file, line + '\n');
  };
  return {
    info: (m, meta) => emit('INFO', m, meta),
    warn: (m, meta) => emit('WARN', m, meta),
    error: (m, meta) => emit('ERROR', m, meta),
    lines: () => buffer.slice(),
  };
}

module.exports = { createLogger };
