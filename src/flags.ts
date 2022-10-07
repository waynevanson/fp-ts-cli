import { option, readonlyTuple } from "fp-ts"
import { constant, constVoid, pipe, tuple } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser } from "parser-ts"
import * as parserString from "./parser"
import * as parserArgs from "./parser-args"

// Build the identifier, names, aliases etc.
export interface Named
  extends Newtype<{ readonly Named: unique symbol }, void> {}

// the argument is added: sometimes or always
export interface Argument
  extends Newtype<{ readonly Argument: unique symbol }, void> {}

// is the flag optional or required?
export interface Flag
  extends Newtype<{ readonly Argumentless: unique symbol }, void> {}

// ad input errors here too.

export interface FlagParser<E, A>
  extends parserArgs.ParserArgs<readonly [A, E]> {}

/** @internal */
export const argument_ = iso<Argument>().from()

/** @internal */
export const flag_ = iso<Flag>().from()

/** @internal */
export const named_ = iso<Named>().from()

/**
 * Creates a long flag (`--flag-name`) with the provided **kebab-case** name.
 * @category Constructor
 */
export const long = (long: string): FlagParser<Named, void> =>
  pipe(
    parserString.longFlag(long),
    parser.map(constant(tuple(constVoid(), named_))),
    parserArgs.fromStringParser
  )

/**
 * Creates additional long flags (`--flag-alias`) with the provided **kebab-case** name.
 * @category Combinator
 */
export const alias =
  (...aliases: ReadonlyArray<string>) =>
  (fa: FlagParser<Named, void>): FlagParser<Named, void> =>
    pipe(
      parserString.shortFlags(aliases),
      parserArgs.fromStringParser,
      parser.map(constant(tuple(constVoid(), named_))),
      parser.alt(() => fa)
    )

/**
 * Creates short flags (`-f`) with the provided **single character**.
 * @category Combinator
 */
export const short =
  (...shorts: ReadonlyArray<string>) =>
  (fa: FlagParser<Named, void>): FlagParser<Named, void> =>
    pipe(
      parserString.shortFlags(shorts),
      parser.map(constant(tuple(constVoid(), named_))),
      parserArgs.fromStringParser,
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
    pipe(fa, parser.map(constant(tuple(a, argument_))))

/**
 * Ensure the flag contains an argument and return it.
 */
export const argument = (
  fa: FlagParser<Named, void>
): FlagParser<Argument, string> =>
  pipe(
    fa,
    parser.apSecond(parserArgs.argument),
    parser.map((string) => tuple(string, argument_))
  )

/**
 * @summary
 * Allow an argument, but it's not necessary.
 */
export const argumental = (
  fa: FlagParser<Named, void>
): FlagParser<Argument, option.Option<string>> =>
  pipe(
    fa,
    parser.apSecond(parser.optional(parserArgs.argument)),
    parser.map((ostring) => tuple(ostring, argument_))
  )

/**
 * Ensure the flag is always provided.
 */
export const required = <A>(fa: FlagParser<Argument, A>): FlagParser<Flag, A> =>
  pipe(fa, parser.cut, parser.map(readonlyTuple.mapSnd(constant(flag_))))

export const optional = <A>(
  fa: FlagParser<Argument, A>
): FlagParser<Flag, option.Option<A>> =>
  pipe(
    fa,
    parser.optional,
    parser.map(option.map(readonlyTuple.fst)),
    parser.map((oa) => tuple(oa, flag_))
  )

/**
 * Same as `optional`, but allows options to be flattened.
 * Useful when used in conjunction with `argumental`.
 */
export const optionally = <A>(
  fa: FlagParser<Argument, option.Option<A>>
): FlagParser<Flag, option.Option<A>> =>
  pipe(
    fa,
    parser.optional,
    parser.map(option.map(readonlyTuple.fst)),
    parser.map(option.flatten),
    parser.map((oa) => tuple(oa, flag_))
  )

// what about an argument without a flag?
// should that be here? or somewhere else?
// easy to distinguish in a parser when lifted up.
// TDD solves this problem.

// arguments should ideally be at the end.
// this is going to be stateful passing,
// or at least we cahange the value of a writer
