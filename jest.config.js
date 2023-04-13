module.exports = {
  verbose: false,
  coverageReporters: ['text', 'lcov'],
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/'],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '<rootDir>/**/**/*',
    '!<rootDir>/src/**/*'
  ],
};
