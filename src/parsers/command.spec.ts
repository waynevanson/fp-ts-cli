import { pipe, tuple } from "fp-ts/lib/function"
import * as flag from "./flag"
import * as command from "./command"
import { parseResult, stream } from "parser-ts"
import { toBuffer } from "../test-utils"

// flags -> arguments ->
describe("command", () => {
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

      const flags = command.flags__({
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
  })
})
