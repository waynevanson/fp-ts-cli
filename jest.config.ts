import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  roots: ["src"],
  // coveragePathIgnorePatterns: ["state-reader-parser", "reader-parser"],
  collectCoverage: true,
};

export default config;
