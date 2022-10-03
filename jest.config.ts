import { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  roots: ["src"],
  coveragePathIgnorePatterns: ["fp"],
  collectCoverage: true,
};

export default config;
