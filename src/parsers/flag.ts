import { option, readonlyTuple } from "fp-ts"
import { constant, constVoid, pipe, tuple } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser } from "parser-ts"
import { parseArgs } from "util"
import * as parserArgs from "./args"
import * as cli from "./cli"

/**
 * @summary
 * Where a flag has at least one matchable name.
 */
export interface Named
  extends Newtype<{ readonly Named: unique symbol }, void> {}

export enum Argument {
  None,
  Optional,
  Required,
}

export enum Flagged {
  Optional,
  Required,
}

export interface Flag {
  readonly argument: option.Option<Argument>
  readonly flagged: Flagged
}

/** @internal */
export const named_ = iso<Named>().from()

/**
 * Creates a long flag (`--flag-name`) with the provided **kebab-case** name.
 * @category Constructor
 */
export const long = (long: string): cli.CLI<Named, void> =>
  pipe(
    parserArgs.longFlag(long),
    parser.map(constant(tuple(constVoid(), named_)))
  )

// fail a parser
const invert = <I, A>(p: parser.Parser<I, A>): parser.Parser<I, void> =>
  pipe(
    p,
    parser.optional,
    parser.chain(
      option.match(
        () => parser.succeed(constVoid()),
        () => parser.zero()
      )
    )
  )

// match one of, then match nonof
/**
 * Creates additional long flags (`--flag-alias`) with the provided **kebab-case** name.
 * @category Combinator
 */
export const aliases =
  (...aliases: ReadonlyArray<string>) =>
  (fa: cli.CLI<Named, void>): cli.CLI<Named, void> => {
    const match = pipe(parserArgs.longFlags(aliases), parser.map(constVoid))

    const mismatch = pipe(match, invert, parser.lookAhead)

    return pipe(
      fa,
      parser.map(constVoid),
      parser.alt(() => match),
      parser.apFirst(parser.expected(mismatch, "multipleFlags")),
      parser.map(constant(tuple(constVoid(), named_)))
    )
  }

/**
 * Creates short flags (`-f`) with the provided **single character**.
 * @category Combinator
 */
export const shorts =
  (...shorts: ReadonlyArray<string>) =>
  (fa: cli.CLI<Named, void>): cli.CLI<Named, void> =>
    pipe(
      parserArgs.shortFlags(shorts),
      parser.map(constant(tuple(constVoid(), named_))),
      parser.alt(() => fa)
    )

/**
 * Ensure the flag contains no arguments.
 *
 * @category Combinator
 */
export const argumentless =
  <A>(a: A) =>
  (fa: cli.CLI<Named, void>): cli.CLI<Argument, A> =>
    pipe(
      fa,
      parser.map(readonlyTuple.bimap(constant(Argument.None), constant(a)))
    )

export const argumental = (
  fa: cli.CLI<Named, void>
): cli.CLI<Argument, option.Option<string>> =>
  pipe(
    fa,
    parser.apSecond(parser.optional(parserArgs.argument)),
    parser.map((ostring) => tuple(ostring, Argument.Optional))
  )

/**
 * Ensure the flag contains an argument and return it.
 */
export const argument = (fa: cli.CLI<Named, void>): cli.CLI<Argument, string> =>
  pipe(
    fa,
    parser.apSecond(parserArgs.argument),
    parser.map((string) => tuple(string, Argument.Required))
  )

/**
 * Ensure the flag is always provided.
 */
export const required = <A>(fa: cli.CLI<Argument, A>): cli.CLI<Flag, A> =>
  pipe(
    fa,
    parser.cut,
    parser.map(
      readonlyTuple.mapSnd((argument) => ({
        argument: option.some(argument),
        flagged: Flagged.Required,
      }))
    )
  )

export const optional = <A>(
  fa: cli.CLI<Argument, A>
): cli.CLI<Flag, option.Option<A>> =>
  pipe(
    fa,
    parser.optional,
    parser.map(
      option.match(
        () => tuple(option.none, option.none),
        readonlyTuple.bimap(option.some, option.some)
      )
    ),
    parser.map(
      readonlyTuple.mapSnd((argument) => ({
        argument,
        flagged: Flagged.Optional,
      }))
    )
  )

/**
 * Same as `optional`, but allows options to be flattened.
 * Useful when used in conjunction with `argumental`.
 */
export const optionally = <A>(
  fa: cli.CLI<Argument, option.Option<A>>
): cli.CLI<Flag, option.Option<A>> =>
  pipe(fa, optional, cli.map(option.flatten))
