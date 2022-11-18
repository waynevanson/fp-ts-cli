import { toBuffer } from "./test-utils"
import * as parseResultWithIndex from "./parse-result-with-index"
import * as parserArgs from "./parser-args"

describe("parser-args", () => {
  it("should allow parsing up to a whole", () => {
    const name = "flag-name"
    const nameExtended = `${name}-extended`
    const inputArg = `--${nameExtended}`
    const input = [inputArg, "next-f"]
    const buffer = toBuffer(input)

    const start = parseResultWithIndex.stream(buffer, { outer: 0, inner: 0 })
    const next = parseResultWithIndex.stream(buffer, { outer: 0, inner: 11 })
    const expected = parseResultWithIndex.success(name, next, start)

    // disjunction is either,
    // conjunction is both.
  })

  // with two next buffers, which do we choose?
  // two successes?
  // if one, which arg to use?
  describe("both", () => {
    const one = "flag-name"
    const two = `${one}-extended`
    const input = [two]
    const buffer = toBuffer(input)

    const start = parseResultWithIndex.stream(buffer, { outer: 0, inner: 0 })
    const next = parseResultWithIndex.stream(buffer, { outer: 0, inner: 11 })
    const expected = parseResultWithIndex.success(one, next, start)

    const parserOne = parserArgs.takeUntilWithIndex()
  })
})
