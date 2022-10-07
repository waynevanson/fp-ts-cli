import { readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"

export const toBuffer = (
  fa: ReadonlyArray<string>
): Array<ReadonlyArray<string>> =>
  pipe(
    fa,
    readonlyArray.map((a) => a.split("")),
    readonlyArray.toArray
  )
