import * as parserWithIndex from "./parser-with-index";
import * as streamWithIndex from "./stream-with-index";
import * as parseResultWithIndex from "./parse-result-with-index";
import { pipe } from "fp-ts/lib/function";
import { Indexable1 } from "./indexable";
import { readonlyArray } from "fp-ts";

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

  describe("chain", () => {
    it.concurrent("should chain with two successes", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.of("a");
      const f = (a: string) => parserWithIndex.of(a + "b");

      const result = pipe(first, parserWithIndex.chain(f))(start);
      const expected = parseResultWithIndex.success("ab", start, start);

      expect(result).toStrictEqual(expected);
    });

    it.concurrent("should fail when first parser fails", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.zero<unknown, unknown, string>();
      const f = (a: string) => parserWithIndex.of(a + "b");

      const result = pipe(first, parserWithIndex.chain(f))(start);
      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });

    it.concurrent("should fail when first parser fails", () => {
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const first = parserWithIndex.of("a");
      const f = () => parserWithIndex.zero<unknown, unknown, unknown>();

      const result = pipe(first, parserWithIndex.chain(f))(start);
      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("getTakeUntilWithIndex", () => {
    it.concurrent("should take until it returns false", () => {
      const Index: Indexable1<readonlyArray.URI, number> = {
        lookup: (i) => (fa) => readonlyArray.lookup(i)(fa),
        next: (i) => () => i + 1,
      };

      const buffer = ["one", "two", "three"];
      const start = streamWithIndex.stream(buffer, 0);
      const end = streamWithIndex.stream(buffer, 2);

      const result = parserWithIndex.getTakeUntilWithIndex(Index)(
        (i, _: string) => i < 2
      )(start);

      const expected = parseResultWithIndex.success(["one", "two"], end, start);

      expect(result).toStrictEqual(expected);
    });

    it.concurrent("should fail the buffer is empty", () => {
      const Index: Indexable1<readonlyArray.URI, number> = {
        lookup: (i) => (fa) => readonlyArray.lookup(i)(fa),
        next: (i) => () => i + 1,
      };

      const start = streamWithIndex.stream([], 0);

      const result = parserWithIndex.getTakeUntilWithIndex(Index)(
        (i, _: string) => i < 2
      )(start);

      const expected = parseResultWithIndex.error(start);

      expect(result).toStrictEqual(expected);
    });
  });

  it.concurrent("should succeed when the whole buffer is consumer", () => {
    const Index: Indexable1<readonlyArray.URI, number> = {
      lookup: (i) => (fa) => readonlyArray.lookup(i)(fa),
      next: (i) => () => i + 1,
    };

    const start = streamWithIndex.stream(["one", "two"], 0);
    const end = streamWithIndex.stream(["one", "two"], 2);

    const result = parserWithIndex.getTakeUntilWithIndex(Index)(() => true)(
      start
    );

    const expected = parseResultWithIndex.success(["one", "two"], end, start);

    expect(result).toStrictEqual(expected);
  });
});
