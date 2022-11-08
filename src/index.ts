import { sequenceS } from "fp-ts/lib/Apply"
import { pipe } from "fp-ts/lib/function"
import { io, option, reader, readonlyArray } from "./fp"
import { argvNode } from "./side-effects"

export type Arg = string

export type Argv = ReadonlyArray<Arg>

export function run(argv: Argv): Argv {
  return pipe(argv, readonlyArray.dropLeft(2))
}

export interface Input {
  readonly runtime: option.Option<string>
  readonly file: option.Option<string>
  readonly args: ReadonlyArray<string>
}

export const node: io.IO<Input> = pipe(
  argvNode,
  io.map(
    sequenceS(reader.Apply)({
      runtime: readonlyArray.lookup(0)<string>,
      file: readonlyArray.lookup(1)<string>,
      args: readonlyArray.dropLeft(2)<string>,
    })
  )
)
