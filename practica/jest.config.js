export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',

    '!src/index.js',
    '!src/config/**/*.js',
    '!src/socket/**/*.js',

    '!src/services/storage.service.js',
    '!src/services/image.service.js',
    '!src/services/logger.service.js',
    '!src/services/notification.service.js',

    '!src/routes/**/*.js',

    '!src/middleware/role.middleware.js',
    '!src/middleware/upload.js',

    '!src/middleware/error-handler.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  verbose: true
};