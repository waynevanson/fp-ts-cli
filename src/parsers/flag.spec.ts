import { constVoid, pipe, tuple } from "fp-ts/lib/function"
import { parseResult, stream } from "parser-ts"
import * as flags from "./flag"
import { kebabCase, toBuffer } from "../test-utils"
import fc from "fast-check"
import { array, string } from "fp-ts"

describe("flags", () => {
  describe("named", () => {
    describe(flags.long, () => {
      it("should match --flag-name", () => {
        fc.assert(
          fc.property(kebabCase, (name) => {
            const flag = `--${name}`
            const buffer = toBuffer([flag])
            const start = stream.stream(buffer)
            const next = stream.stream(buffer, buffer.length)

            const result = flags.long(name)(start)

            const expected = parseResult.success(
              tuple(constVoid(), flags.named_),
              next,
              start
            )

            expect(result).toStrictEqual(expected)
          })
        )
      })

      it("should not match a flag that does not exist", () => {
        const kebabCaseUnion = kebabCase.chain((a) =>
          kebabCase.filter((b) => a !== b).map((b) => tuple(a, b))
        )

        fc.assert(
          fc.property(kebabCaseUnion, ([included, excluded]) => {
            const flag = `--${included}`
            const buffer = toBuffer([flag])
            const start = stream.stream(buffer)
            const result = flags.long(excluded)(start)
            const expected = parseResult.error(start, ["longFlag"])
            expect(result).toStrictEqual(expected)
          })
        )
      })
    })

    describe(flags.aliases, () => {
      it("should match the alias as a long flag", () => {
        const kebabCaseUnions = fc
          .array(kebabCase, { minLength: 1 })
          .filter((bs) =>
            bs.some((b, i, bs) => bs.slice(i + 1).some((a) => b !== a))
          )

        fc.assert(
          fc.property(kebabCaseUnions, ([name, ...aliases]) => {
            const parser_ = pipe(flags.long(name), flags.aliases(...aliases))

            for (const alias of aliases) {
              const flag = `--${alias}`
              const buffer = toBuffer([flag])
              const start = stream.stream(buffer)
              const next = stream.stream(buffer, buffer.length)
              const result = parser_(start)

              const expected = parseResult.success(
                tuple(constVoid(), flags.named_),
                next,
                start
              )

              expect(result).toStrictEqual(expected)
            }
          })
        )
      })
      it.todo("should match only one of the aliases")
    })

    describe(flags.shorts, () => {
      it.todo("should match when the short flag is provided")
      it.todo(
        "should not match any short when the non-short flag has been provided"
      )
    })
  })

  describe(flags.argument, () => {
    it.todo("should allow an argument to be passed")
    it.todo("should fail when there is no argument")
  })

  describe(flags.argumentless, () => {
    it.todo("should succeed when there is no argument")
  })

  describe(flags.argumental, () => {
    it.todo("should succeed an argument to be passed")
    it.todo("should succeed when there is no argument")
  })
})
