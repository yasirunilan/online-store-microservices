import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  testTimeout: 30_000,
  globalSetup: './setup/global-setup.ts',
};

export default config;
