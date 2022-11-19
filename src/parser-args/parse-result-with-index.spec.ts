import { either } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import * as parseResultWithIndex from "./parse-result-with-index";
import * as streamWithIndex from "./stream-with-index";

describe("success", () => {
  it.concurrent("should pass th args", () => {
    const buffer = "one";
    const start = streamWithIndex.stream(buffer, 0);
    const next = streamWithIndex.stream(buffer, 4);
    const value = "a";
    const result = parseResultWithIndex.success(value, next, start);
    const expected = either.right({ next, start, value });
    expect(result).toStrictEqual(expected);
  });
});

describe("error", () => {
  it.concurrent("should pass th args", () => {
    const buffer = "one";
    const input = streamWithIndex.stream(buffer, 0);
    const expected = [] as ReadonlyArray<never>;
    const fatal = true;
    const result = parseResultWithIndex.error(input, expected, fatal);
    const expected_ = either.left({ input, expected, fatal });
    expect(result).toStrictEqual(expected_);
  });

  it.concurrent("should default the fatal parameter as false", () => {
    const buffer = "one";
    const input = streamWithIndex.stream(buffer, 0);
    const expected = [] as ReadonlyArray<never>;
    const result = parseResultWithIndex.error(input, expected);
    const expected_ = either.left({ input, expected, fatal: false });
    expect(result).toStrictEqual(expected_);
  });

  it.concurrent(
    "should default the expected as empty and empty as false",
    () => {
      const buffer = "one";
      const input = streamWithIndex.stream(buffer, 0);
      const result = parseResultWithIndex.error(input);
      const expected = either.left({ input, expected: [], fatal: false });
      expect(result).toStrictEqual(expected);
    }
  );
});

describe("map", () => {
  it.concurrent(
    "should apply a function to the value inside the successful result",
    () => {
      const n = 3;
      const f = (n: number) => n + 1;
      const stream = streamWithIndex.stream("one", 2);
      const result = pipe(
        parseResultWithIndex.success(n, stream, stream),
        parseResultWithIndex.map(f)
      );

      const expected = parseResultWithIndex.success(f(n), stream, stream);
      expect(result).toStrictEqual(expected);
    }
  );
});
