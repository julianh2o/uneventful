module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^yaml$': '<rootDir>/../node_modules/yaml/dist/index.js',
  },
};
