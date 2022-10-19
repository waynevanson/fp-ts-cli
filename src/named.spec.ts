import { pipe } from "fp-ts/lib/function"
import { either, readonlyArray, readonlyNonEmptyArray } from "./fp"
import * as named from "./named"

describe("named", () => {
  describe(named.fromLong, () => {
    it("should construct a named from a single long value", () => {
      const input = "kebab-case"
      const result = named.fromLong(input)
      const expected = either.right<never, named.Name>({
        longs: readonlyNonEmptyArray.of(input),
        shorts: readonlyArray.empty,
      })
      expect(result).toStrictEqual(expected)
    })
  })

  describe(named.aliases, () => {
    it("should allow updating a named with many long values", () => {
      const input = ["kebab-case", "casey-kebabs"]
      const name: named.Name = {
        longs: readonlyNonEmptyArray.of("baby-case"),
        shorts: readonlyArray.empty,
      }
      const result = named.aliases(input)(name)
      const expected = either.right<never, named.Name>({
        longs: pipe(name.longs, readonlyNonEmptyArray.concat(input)),
        shorts: readonlyArray.empty,
      })
      expect(result).toStrictEqual(expected)
    })

    describe(named.shorts, () => {
      it("should allow updating a named with many long values", () => {
        const input = ["k", "c"]
        const name: named.Name = {
          longs: readonlyNonEmptyArray.of("kebab-case"),
          shorts: readonlyArray.of("b"),
        }
        const result = named.shorts(input)(name)
        const expected = either.right<never, named.Name>({
          longs: name.longs,
          shorts: pipe(name.shorts, readonlyArray.concat(input)),
        })
        expect(result).toStrictEqual(expected)
      })
    })
  })
})
