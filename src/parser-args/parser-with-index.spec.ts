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
    it.concurrent("should apply a function on the parsers value", () => {
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
    it.concurrent("should apply the first parser if successful", () => {
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

    it.concurrent(
      "should apply the second parser when the first is successful",
      () => {
        const value = "a";
        const buffer = ["one", "two"];
        const start = streamWithIndex.stream(buffer, "three");
        const first = parserWithIndex.zero<unknown, unknown, string>();
        const second = parserWithIndex.of(value);

        const result = pipe(
          first,
          parserWithIndex.alt(() => second)
        )(start);

        const expected = parseResultWithIndex.success(value, start, start);

        expect(result).toStrictEqual(expected);
      }
    );

    it.concurrent("should fail when both parser fail", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.zero<unknown, unknown, string>();
      const second = parserWithIndex.zero<unknown, unknown, string>();

      const result = pipe(
        first,
        parserWithIndex.alt(() => second)
      )(start);

      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("ap", () => {
    it.concurrent(
      "should apply the first parser over the second parser monadically",
      () => {
        const value = "a";
        const buffer = ["one", "two"];
        const start = streamWithIndex.stream(buffer, "three");
        const f = (a: string) => a + "b";
        const first = parserWithIndex.of(f);
        const second = parserWithIndex.of(value);

        const result = pipe(first, parserWithIndex.ap(second))(start);
        const expected = parseResultWithIndex.success(f(value), start, start);

        expect(result).toStrictEqual(expected);
      }
    );

    it.concurrent("should fail when the first fails", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const f = (a: string) => a + "b";
      const first = parserWithIndex.of(f);
      const second = parserWithIndex.zero<unknown, unknown, string>();

      const result = pipe(first, parserWithIndex.ap(second))(start);
      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });

    it.concurrent("should fail when the second fails", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.zero<
        unknown,
        unknown,
        (a: string) => string
      >();
      const second = parserWithIndex.of("a");

      const result = pipe(first, parserWithIndex.ap(second))(start);
      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });
  });
});
