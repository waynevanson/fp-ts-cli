import { sequenceS } from "fp-ts/lib/Apply"
import { constTrue, pipe, unsafeCoerce } from "fp-ts/lib/function"
import {
  either,
  io,
  option,
  reader,
  readonlyArray,
  readonlyNonEmptyArray,
} from "./fp"
import { argvNode } from "./side-effects"

export type Arg = string

export type Argv = ReadonlyArray<Arg>

export function run(input: Input): ReadonlyArray<string> {
  return input.args
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

export interface Named {
  readonly longs: readonlyNonEmptyArray.ReadonlyNonEmptyArray<string>
  readonly shorts: ReadonlyArray<string>
}

export const required = (named: Named) => (args: ReadonlyArray<string>) =>
  pipe(
    args,
    either.fromPredicate(
      readonlyArray.some((arg) =>
        pipe(
          named.longs,
          (a) => a as ReadonlyArray<string>,
          readonlyArray.some((long) => `--${long}` === arg)
        )
      ),
      () => "Args does not contain any long flags"
    ),
    either.map(constTrue)
  )
