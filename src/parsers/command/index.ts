import { readonlyArray, readonlyRecord, readonlyTuple, string } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser, parseResult, stream } from "parser-ts"
import * as flag from "../flag"
import { flags as flags_ } from "./flags"

export const flags: <T extends Record<string, any>>(structs: {
  [P in keyof T]: flag.FlagParser<flag.Flag, T[P]>
}) => flag.FlagParser<Command, T> = flags_

export interface Command
  extends Newtype<{ readonly Command: unique symbol }, void> {}

export interface SubCommands
  extends Newtype<{ readonly SubCommands: unique symbol }, void> {}

export const command_ = iso<Command>().from()
export const subcommands_ = iso<SubCommands>().from()

export type EnforceNonEmptyRecord<R> = keyof R extends never ? never : R

/**
 * @summary
 * Combine one or more commands into a new command.
 */
export const subcommands = <T extends Record<string, any>>(
  sum: EnforceNonEmptyRecord<{
    [P in keyof T]: flag.FlagParser<Command, T[P]>
  }>
): flag.FlagParser<
  SubCommands,
  { [P in keyof T]: { _type: P; value: T[P] } }[keyof T]
> =>
  pipe(
    sum,
    readonlyRecord.fromRecord,
    readonlyRecord.mapWithIndex((_type, p) =>
      pipe(
        p,
        flag.map((value) => ({ _type, value }))
      )
    ),
    readonlyRecord.reduce(string.Ord)(
      parser.zero<ReadonlyArray<string>, any>(),
      (b, a) => parser.either(b, () => a)
    )
  )

export const parse =
  (arguments_: Array<string>) =>
  <A>(
    command: flag.FlagParser<Command, A>
  ): parseResult.ParseResult<ReadonlyArray<string>, A> =>
    pipe(
      arguments_,
      readonlyArray.map((string) => string.split("")),
      readonlyArray.toArray,
      stream.stream,
      pipe(command, parser.map(readonlyTuple.fst))
    )
