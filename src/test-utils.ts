import fc, { ArrayConstraints, uniqueArray } from "fast-check"
import { eq, readonlyArray, string } from "fp-ts"
import { pipe } from "fp-ts/lib/function"

export const toBuffer = (
  fa: ReadonlyArray<string>
): Array<ReadonlyArray<string>> =>
  pipe(
    fa,
    readonlyArray.map((a) => a.split("")),
    readonlyArray.toArray
  )

export const kebabCase = fc
  .string({ minLength: 1 })
  .filter((string) => /^[a-z]+(-[a-z]*)*$/.test(string))

export const kebabCaseUnions = (arrayConstraints?: ArrayConstraints) =>
  fc.uniqueArray(kebabCase, {
    ...arrayConstraints,
    comparator: "IsStrictlyEqual",
  })

export const charLetter = fc.char().filter((char) => /^[a-z]$/.test(char))

export const charUnions = (arrayConstraints?: ArrayConstraints) =>
  fc.uniqueArray(charLetter, {
    ...arrayConstraints,
    comparator: "IsStrictlyEqual",
  })
