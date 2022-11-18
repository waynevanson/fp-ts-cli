import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  rootDir: "../",
  roots: ["src"],
  collectCoverage: true,
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
  collectCoverageFrom: ["**/*.ts"],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/fp/",
    "<rootDir>/src/test-utils.ts",
  ],
};

export default config;
