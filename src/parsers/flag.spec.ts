import { constVoid, pipe, tuple } from "fp-ts/lib/function"
import { parseResult, stream } from "parser-ts"
import * as flags from "./flag"
import {
  kebabCase,
  kebabCaseUnions,
  toBuffer,
  charUnions,
  charLetter,
} from "../test-utils"
import fc from "fast-check"
import { option } from "fp-ts"

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
        fc.assert(
          fc.property(
            kebabCaseUnions({ minLength: 2, maxLength: 2 }),
            ([included, excluded]) => {
              const flag = `--${included}`
              const buffer = toBuffer([flag])
              const start = stream.stream(buffer)
              const result = flags.long(excluded)(start)
              const expected = parseResult.error(start, ["longFlag"])
              expect(result).toStrictEqual(expected)
            }
          )
        )
      })
    })

    describe(flags.aliases, () => {
      it("should match the alias as a long flag", () => {
        fc.assert(
          fc.property(
            kebabCaseUnions({ minLength: 2 }),
            ([name, ...aliases]) => {
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
            }
          )
        )
      })

      it("should fail when more than one alias is used", () => {
        fc.assert(
          fc.property(
            kebabCaseUnions({ minLength: 3 }),
            ([long, ...aliases]) => {
              const parser_ = pipe(flags.long(long), flags.aliases(...aliases))

              const flag = aliases.map((alias) => `--${alias}`)
              const buffer = toBuffer(flag)
              const start = stream.stream(buffer)
              const end = stream.stream(buffer, 2)
              const result = parser_(start)

              const expected = parseResult.error(end, ["multipleFlags"])

              expect(result).toStrictEqual(expected)
            }
          )
        )
      })
    })

    describe(flags.shorts, () => {
      it("should match when the short flag is provided", () => {
        fc.assert(
          fc.property(kebabCase, charLetter, (long, included) => {
            const flag = `-${included}`
            const buffer = toBuffer([flag])
            const start = stream.stream(buffer)
            const next = stream.stream(buffer, buffer.length)
            const result = pipe(flags.long(long), flags.shorts(included))(start)
            const value = tuple(constVoid(), constVoid())
            const expected = parseResult.success(value, next, start)
            expect(result).toStrictEqual(expected)
          })
        )
      })

      it("should not match any short when the non-short flag has been provided", () => {
        fc.assert(
          fc.property(
            kebabCase,
            charUnions({ minLength: 2, maxLength: 2 }),
            (long, [included, excluded]) => {
              const flag = `-${excluded}`
              const buffer = toBuffer([flag])
              const start = stream.stream(buffer)
              const result = pipe(
                flags.long(long),
                flags.shorts(included)
              )(start)
              const expected = parseResult.error(start, [
                "longFlag",
                "shortFlag",
              ])
              expect(result).toStrictEqual(expected)
            }
          )
        )
      })
    })
  })

  describe(flags.argument, () => {
    it("should allow an argument to be passed", () => {
      fc.assert(
        fc.property(kebabCase, fc.string(), (long, argument) => {
          const buffer = toBuffer([`--${long}`, argument])
          const start = stream.stream(buffer)
          const next = stream.stream(buffer, buffer.length)
          const parser = pipe(flags.long(long), flags.argument)
          const result = parser(start)

          const value = tuple(argument, flags.Argument.Required)
          const expected = parseResult.success(value, next, start)

          expect(result).toStrictEqual(expected)
        })
      )
    })

    it("should fail when there is no argument", () => {
      fc.assert(
        fc.property(kebabCase, (long) => {
          const buffer = toBuffer([`--${long}`])
          const start = stream.stream(buffer)
          const next = stream.stream(buffer, buffer.length)
          const parser = pipe(flags.long(long), flags.argument)
          const result = parser(start)

          const expected = parseResult.error(next, ["Argument"])

          expect(result).toStrictEqual(expected)
        })
      )
    })
  })

  describe(flags.argumentless, () => {
    it("should succeed when there is no argument", () => {
      fc.assert(
        fc.property(kebabCase, fc.string(), (long, argument) => {
          const buffer = toBuffer([`--${long}`])
          const start = stream.stream(buffer)
          const next = stream.stream(buffer, buffer.length)
          const parser = pipe(flags.long(long), flags.argumentless(argument))
          const result = parser(start)
          const value = tuple(argument, flags.Argument.None)
          const expected = parseResult.success(value, next, start)

          expect(result).toStrictEqual(expected)
        })
      )
    })
  })

  describe(flags.argumental, () => {
    it("should succeed an argument to be passed", () => {
      fc.assert(
        fc.property(kebabCase, fc.string(), (long, argument) => {
          const buffer = toBuffer([`--${long}`, argument])
          const start = stream.stream(buffer)
          const next = stream.stream(buffer, buffer.length)
          const parser = pipe(flags.long(long), flags.argumental)
          const result = parser(start)

          const value = tuple(option.some(argument), flags.Argument.Optional)
          const expected = parseResult.success(value, next, start)

          expect(result).toStrictEqual(expected)
        })
      )
    })

    it("should succeed when there is no argument", () => {
      fc.assert(
        fc.property(kebabCase, (long) => {
          const buffer = toBuffer([`--${long}`])
          const start = stream.stream(buffer)
          const next = stream.stream(buffer, buffer.length)
          const parser = pipe(flags.long(long), flags.argumental)
          const result = parser(start)

          const value = tuple(option.none, flags.Argument.Optional)
          const expected = parseResult.success(value, next, start)

          expect(result).toStrictEqual(expected)
        })
      )
    })
  })
})
