import { pipe } from "fp-ts/lib/function"
import { readonlyArray } from "./fp"

export type Arg = string

export type Argv = ReadonlyArray<Arg>

export function run(argv: Argv): Argv {
  return pipe(
    argv,
    readonlyArray.filterWithIndex((index) => index >= 2)
  )
}
