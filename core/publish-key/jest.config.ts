import type { Config } from "jest";

export default {
  preset: "ts-jest",
  clearMocks: true,
  //modulePaths: ["<rootDir>/**/src"],
  collectCoverageFrom: ["src/**/*"],
  coveragePathIgnorePatterns: ["**/tests/jest.custom.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
    setupFiles: [
    './jest.setup.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
} satisfies Config;
