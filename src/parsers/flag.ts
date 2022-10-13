import { option, readonlyTuple } from "fp-ts"
import { constant, constVoid, pipe, tuple } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser } from "parser-ts"
import * as parserArgs from "./args"
import * as parserString from "./string"

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

export type FlagParser<E, A> = parserArgs.ParserArgs<readonly [A, E]>

/** @internal */
export const named_ = iso<Named>().from()

/**
 * Creates a long flag (`--flag-name`) with the provided **kebab-case** name.
 * @category Constructor
 */
export const long = (long: string): FlagParser<Named, void> =>
  pipe(
    parserString.longFlag(long),
    parserArgs.fromStringParser,
    parser.map(constant(tuple(constVoid(), named_)))
  )

/**
 * Creates additional long flags (`--flag-alias`) with the provided **kebab-case** name.
 * @category Combinator
 */
export const aliases =
  (...aliases: ReadonlyArray<string>) =>
  (fa: FlagParser<Named, void>): FlagParser<Named, void> =>
    pipe(
      parserString.longFlags(aliases),
      parserArgs.fromStringParser,
      parser.map(constant(tuple(constVoid(), named_))),
      parser.alt(() => fa)
    )

/**
 * Creates short flags (`-f`) with the provided **single character**.
 * @category Combinator
 */
export const shorts =
  (...shorts: ReadonlyArray<string>) =>
  (fa: FlagParser<Named, void>): FlagParser<Named, void> =>
    pipe(
      parserString.shortFlags(shorts),
      parserArgs.fromStringParser,
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
  (fa: FlagParser<Named, void>): FlagParser<Argument, A> =>
    pipe(
      fa,
      parser.map(readonlyTuple.bimap(constant(Argument.None), constant(a)))
    )

export const argumental = (
  fa: FlagParser<Named, void>
): FlagParser<Argument, option.Option<string>> =>
  pipe(
    fa,
    parser.apSecond(parser.optional(parserArgs.argument)),
    parser.map((ostring) => tuple(ostring, Argument.Optional))
  )

/**
 * Ensure the flag contains an argument and return it.
 */
export const argument = (
  fa: FlagParser<Named, void>
): FlagParser<Argument, string> =>
  pipe(
    fa,
    parser.apSecond(parserArgs.argument),
    parser.map((string) => tuple(string, Argument.Required))
  )

/**
 * Ensure the flag is always provided.
 */
export const required = <A>(fa: FlagParser<Argument, A>): FlagParser<Flag, A> =>
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

export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(fa: FlagParser<E, A>): FlagParser<E, B> =>
    pipe(fa, parser.map(readonlyTuple.mapFst(f)))

export const optional = <A>(
  fa: FlagParser<Argument, A>
): FlagParser<Flag, option.Option<A>> =>
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
  fa: FlagParser<Argument, option.Option<A>>
): FlagParser<Flag, option.Option<A>> => pipe(fa, optional, map(option.flatten))
