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
