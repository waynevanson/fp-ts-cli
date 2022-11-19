import * as parserWithIndex from "./parser-with-index";
import * as streamWithIndex from "./stream-with-index";
import * as parseResultWithIndex from "./parse-result-with-index";
import { pipe } from "fp-ts/lib/function";

describe("parserWithIndex", () => {
  describe("of", () => {
    it.concurrent("should put the value inside the parser value", () => {
      const value = "a";
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const result = parserWithIndex.of(value)(start);
      const expected = parseResultWithIndex.success(value, start, start);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("map", () => {
    it("should apply a function on the parsers value", () => {
      const value = "a";
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const f = (a: string) => a + "b";
      const result = pipe(
        parserWithIndex.of(value),
        parserWithIndex.map(f)
      )(start);

      const expected = parseResultWithIndex.success(f(value), start, start);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("alt", () => {
    it.concurrent("should parse one of the parsers", () => {
      const value = "a";
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.of(value);
      const second = parserWithIndex.of("b");

      const result = pipe(
        first,
        parserWithIndex.alt(() => second)
      )(start);

      const expected = parseResultWithIndex.success(value, start, start);

      expect(result).toStrictEqual(expected);
    });
  });
});
