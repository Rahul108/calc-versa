// Plain JS so Jest does not need ts-node (the TS config could not be parsed with the
// workspace's NodeNext module settings).
module.exports = {
  displayName: 'calc-versa-react',
  preset: '../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../coverage/frontend',
  testEnvironment: 'jsdom',
  // import.meta.env (Vite) cannot be parsed by Jest; use fixed test URLs instead.
  moduleNameMapper: {
    '^(.*)/config/env$': '<rootDir>/src/app/config/env.test-stub.ts',
  },
};
