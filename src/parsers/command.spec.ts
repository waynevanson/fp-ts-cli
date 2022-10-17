import { pipe, tuple } from "fp-ts/lib/function"
import * as flag from "./flag"
import * as command from "./command"
import { parseResult, stream } from "parser-ts"
import { toBuffer } from "../test-utils"
import { option } from "fp-ts"

// flags -> arguments ->
describe.skip("command", () => {
  describe("flags", () => {
    it("should ensure both required flags are present", () => {
      expect.assertions(1)

      const flagOne = pipe(
        flag.long("flag-one"),
        flag.aliases("flag-one-alias-one", "flag-one-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagOneValue"),
        flag.required
      )

      const flagTwo = pipe(
        flag.long("flag-two"),
        flag.aliases("flag-two-alias-one", "flag-two-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagTwoValue"),
        flag.required
      )

      const flags = command.flags({
        flagOne,
        flagTwo,
      })

      const buffer = toBuffer(["--flag-one", "--flag-two"])
      const start = stream.stream(buffer)
      const next = stream.stream(buffer, buffer.length)

      const result = flags(start)
      const expected = parseResult.success(
        tuple(
          { flagOne: "flagOneValue", flagTwo: "flagTwoValue" },
          command.command_
        ),
        next,
        start
      )

      expect(result).toStrictEqual(expected)
    })

    it("should ensure only required flag is present but provide both values", () => {
      expect.assertions(1)

      const flagOne = pipe(
        flag.long("flag-one"),
        flag.aliases("flag-one-alias-one", "flag-one-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagOneValue"),
        flag.required
      )

      const flagTwo = pipe(
        flag.long("flag-two"),
        flag.aliases("flag-two-alias-one", "flag-two-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagTwoValue"),
        flag.optional
      )

      const flags = command.flags({
        flagOne,
        flagTwo,
      })

      const buffer = toBuffer(["--flag-one"])
      const start = stream.stream(buffer)
      const next = stream.stream(buffer, buffer.length)

      const result = flags(start)
      const expected = parseResult.success(
        tuple(
          { flagOne: "flagOneValue", flagTwo: option.none },
          command.command_
        ),
        next,
        start
      )

      expect(result).toStrictEqual(expected)
    })

    it("should ensure both flags is present and provide both values", () => {
      expect.assertions(1)

      const flagOne = pipe(
        flag.long("flag-one"),
        flag.aliases("flag-one-alias-one", "flag-one-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagOneValue"),
        flag.required
      )

      const flagTwo = pipe(
        flag.long("flag-two"),
        flag.aliases("flag-two-alias-one", "flag-two-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagTwoValue"),
        flag.optional
      )

      const flags = command.flags({
        flagOne,
        flagTwo,
      })

      const buffer = toBuffer(["--flag-one", "--flag-two"])
      const start = stream.stream(buffer)
      const next = stream.stream(buffer, buffer.length)

      const result = flags(start)
      const expected = parseResult.success(
        tuple(
          { flagOne: "flagOneValue", flagTwo: option.some("flagTwoValue") },
          command.command_
        ),
        next,
        start
      )

      expect(result).toStrictEqual(expected)
    })
  })

  describe("subcommands", () => {
    it.skip("should allow multiple commands", () => {
      expect.assertions(1)

      const flagOne = pipe(
        flag.long("flag-one"),
        flag.aliases("flag-one-alias-one", "flag-one-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagOneValue"),
        flag.required
      )

      const flagTwo = pipe(
        flag.long("flag-two"),
        flag.aliases("flag-two-alias-one", "flag-two-alias-two"),
        flag.shorts("o"),
        flag.argumentless("flagTwoValue"),
        flag.required
      )

      const flagsOne = command.flags({ flagOne })

      const flagsTwo = command.flags({ flagTwo })

      const buffer = toBuffer(["flagOne", "--flag-one"])
      const start = stream.stream(buffer)
      const next = stream.stream(buffer, buffer.length)

      const result = command.subcommands({ flagsOne, flagsTwo })(start)

      const expected = parseResult.success(
        tuple(
          { _type: "flagsOne", value: { flagOne: "flagOneValue" } },
          command.command_
        ),
        next,
        start
      )

      expect(result).toStrictEqual(expected)
    })
  })
})
