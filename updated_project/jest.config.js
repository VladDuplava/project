// jest.config.js

module.exports = {
  verbose: true,
  forceExit: true,
  coverageReporters: ['text', 'lcov'],
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['**/tests/**/*.test.js'],
      testPathIgnorePatterns: ['node_modules', '/tests/models/'],
      collectCoverageFrom: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'models/**/*.js',
      ],
      moduleNameMapper: {
        // Models
        '^\\.\\./models/Book$':          '<rootDir>/tests/__mocks__/Book.js',
        '^\\.\\./\\.\\./models/Book$':   '<rootDir>/tests/__mocks__/Book.js',
        '^\\.\\./models/Rental$':         '<rootDir>/tests/__mocks__/Rental.js',
        '^\\.\\./\\.\\./models/Rental$':  '<rootDir>/tests/__mocks__/Rental.js',
        '^\\.\\./models/User$':           '<rootDir>/tests/__mocks__/User.js',
        '^\\.\\./\\.\\./models/User$':    '<rootDir>/tests/__mocks__/User.js',
        // DB
        '^\\.\\./config/database$':        '<rootDir>/tests/__mocks__/db.js',
        '^\\.\\./\\.\\./config/database$': '<rootDir>/tests/__mocks__/db.js',
      },
    },
    {
      displayName: 'models',
      testEnvironment: 'node',
      testMatch: ['**/tests/models/**/*.test.js'],
      collectCoverageFrom: ['models/**/*.js'],
      moduleNameMapper: {
        '^\\.\\./config/database$':        '<rootDir>/tests/__mocks__/databaseModelTest.js',
        '^\\.\\./\\.\\./config/database$': '<rootDir>/tests/__mocks__/databaseModelTest.js',
      },
    },
  ],
};
