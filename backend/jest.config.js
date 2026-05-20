module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  verbose: true,
  moduleNameMapper: {
    // dateformat is pure-ESM (type: "module"); map it to a CJS shim so Jest can load index.js
    '^dateformat$': '<rootDir>/__mocks__/dateformat.js',
  },
};
