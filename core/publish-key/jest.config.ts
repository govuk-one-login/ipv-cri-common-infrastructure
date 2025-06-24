import type { Config } from "jest";

export default {
  preset: "ts-jest",
  clearMocks: true,
  //modulePaths: ["<rootDir>/**/src"],
  collectCoverageFrom: ["src/**/*"],
  // coveragePathIgnorePatterns: ["**/tests/jest.custom.ts"],
  testMatch: ["**/tests/**/*.test.ts"],
    setupFiles: [
    './jest.setup.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 96,
      branches: 85,
      functions: 100,
      lines: 96,
    },
  },
} satisfies Config;
