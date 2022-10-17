import { readonlyArray, readonlyRecord, readonlyTuple, string } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser, parseResult, stream } from "parser-ts"
import * as flag from "../flag"
import { flags as flags_ } from "./flags"
import * as cli from "../cli"
import * as argument_ from "../argument"

export const flags: <T extends Record<string, any>>(structs: {
  [P in keyof T]: cli.CLI<flag.Flag, T[P]>
}) => cli.CLI<Command, T> = flags_

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
export const subcommands = <
  E extends Command | SubCommands,
  T extends Record<string, any>
>(
  sum: EnforceNonEmptyRecord<{
    [P in keyof T]: cli.CLI<Command, T[P]>
  }>
): cli.CLI<E, { [P in keyof T]: { _tag: P; value: T[P] } }[keyof T]> =>
  pipe(
    sum,
    readonlyRecord.fromRecord,
    readonlyRecord.map((p) => parser.seq(argument_.required, () => p)),
    readonlyRecord.mapWithIndex((_tag, p) =>
      pipe(
        p,
        cli.map((value) => ({ _tag, value }))
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
    command: cli.CLI<Command, A>
  ): parseResult.ParseResult<ReadonlyArray<string>, A> =>
    pipe(
      arguments_,
      readonlyArray.map((string) => string.split("")),
      readonlyArray.toArray,
      stream.stream,
      pipe(command, parser.map(readonlyTuple.fst))
    )
