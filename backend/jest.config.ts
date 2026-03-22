import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  globalSetup: '<rootDir>/src/__tests__/setup.ts',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 50,
      statements: 50
    }
  }
}

export default config
