import { either } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import * as parseResultWithIndex from "./parse-result-with-index"

describe("stream", () => {
  it("should construct a stream using the input parameters", () => {
    const buffer = "one"
    const cursor = 2
    const result = parseResultWithIndex.stream(buffer, cursor)
    const expected: parseResultWithIndex.StreamWithIndex<string, number> = {
      buffer,
      cursor,
    }
    expect(result).toStrictEqual(expected)
  })
})

describe("success", () => {
  it("should pass th args", () => {
    const buffer = "one"
    const start = parseResultWithIndex.stream(buffer, 0)
    const next = parseResultWithIndex.stream(buffer, 4)
    const value = "a"
    const result = parseResultWithIndex.success(value, next, start)
    const expected = either.right({ next, start, value })
    expect(result).toStrictEqual(expected)
  })
})

describe("error", () => {
  it("should pass th args", () => {
    const buffer = "one"
    const input = parseResultWithIndex.stream(buffer, 0)
    const expected = [] as ReadonlyArray<never>
    const fatal = true
    const result = parseResultWithIndex.error(input, expected, fatal)
    const expected_ = either.left({ input, expected, fatal })
    expect(result).toStrictEqual(expected_)
  })

  it("should default the fatal parameter as false", () => {
    const buffer = "one"
    const input = parseResultWithIndex.stream(buffer, 0)
    const expected = [] as ReadonlyArray<never>
    const result = parseResultWithIndex.error(input, expected)
    const expected_ = either.left({ input, expected, fatal: false })
    expect(result).toStrictEqual(expected_)
  })

  it("should default the expected as empty and empty as false", () => {
    const buffer = "one"
    const input = parseResultWithIndex.stream(buffer, 0)
    const result = parseResultWithIndex.error(input)
    const expected = either.left({ input, expected: [], fatal: false })
    expect(result).toStrictEqual(expected)
  })
})

describe("map", () => {
  it("should apply a function to the value inside the successful result", () => {
    const n = 3
    const f = (n: number) => n + 1
    const stream = parseResultWithIndex.stream("one", 2)
    const result = pipe(
      parseResultWithIndex.success(n, stream, stream),
      parseResultWithIndex.map(f)
    )

    const expected = parseResultWithIndex.success(f(n), stream, stream)
    expect(result).toStrictEqual(expected)
  })
})
