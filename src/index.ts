import { pipe } from "fp-ts/lib/function"
import { io, option, readonlyArray } from "./fp"
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
  io.Do,
  io.bind("runtime", () => pipe(argvNode, io.map(readonlyArray.lookup(0)))),
  io.bind("file", () => pipe(argvNode, io.map(readonlyArray.lookup(1)))),
  io.bind("args", () => pipe(argvNode, io.map(readonlyArray.dropLeft(2))))
)
