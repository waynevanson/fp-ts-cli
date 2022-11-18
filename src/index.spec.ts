import { option, readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import process from "process"
import { Input, node, run } from "./index"

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
