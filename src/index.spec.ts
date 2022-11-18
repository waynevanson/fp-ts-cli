import { either, option, readonlyArray, readonlyNonEmptyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import process from "process"
import { parseResult, stream } from "./fp/parser"
import { Input, Named, node, required, run } from "./index"
import { toBuffer } from "./test-utils"
import { OuterInner } from "./outer-inner"

describe("cli", () => {
  it("should parse the input?", () => {
    const args: ReadonlyArray<string> = []
    const runtime = "runtime"
    const file = "file"

    const data: Input = {
      runtime: option.some(runtime),
      file: option.some(file),
      args,
    }

    const result = run(data)

    expect(result).toStrictEqual(args)
  })

  it.only("should allow parsing a long flag", () => {
    const long = "flag-name"
    const named: Named = {
      longs: readonlyNonEmptyArray.of(long),
      shorts: readonlyArray.zero(),
    }
    const constructor = required(named)
    const buffer = toBuffer([`--${long}`])
    const start = stream.stream(buffer)
    const end = stream.stream(buffer, buffer.length)

    const result = constructor({ buffer, cursor: { inner: 0, outer: 0 } })
    const expected = parseResult.success(true, end, start)
    expect(result).toStrictEqual(expected)
  })

  it("should fail when a the flag does not exist", () => {
    const long = {
      required: "flag-required",
      instead: "flag-instead",
    }

    const named: Named = {
      longs: readonlyNonEmptyArray.of(long.required),
      shorts: readonlyArray.zero(),
    }

    const constructor = required(named)
    const args = [`--${long.instead}`]

    const result = constructor(args)
    const expected = either.left("Args does not contain any long flags")
    expect(result).toStrictEqual(expected)
  })

  it("should get the node environment from the outside world", () => {
    const args: ReadonlyArray<string> = []
    const runtime = "runtime"
    const file = "file"

    const argv = pipe([runtime, file], readonlyArray.concat(args))

    process.argv = argv as Array<string>

    const result = node()

    const expected: Input = {
      runtime: option.some(runtime),
      file: option.some(file),
      args,
    }

    expect(result).toStrictEqual(expected)
  })
})
