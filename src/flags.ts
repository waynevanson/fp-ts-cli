import { option, reader } from "fp-ts"
import { constant, constFalse, constTrue, pipe } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import { parser } from "parser-ts"
import { Alias, Long } from "./identifier"
import * as parserString from "./parser"
import * as parserArgs from "./parser-args"

export interface Named
  extends Newtype<{ readonly Named: unique symbol }, void> {}

export interface Valued<A extends boolean>
  extends Newtype<{ readonly Valued: unique symbol }, A> {}

const named = iso<Named>().from()

const valued = <A extends boolean>(a: A) => iso<Valued<A>>().from(a)

export const long = (long: Long): parserArgs.ParserArgs<Named> =>
  pipe(
    parserString.longFlag(long),
    parser.map(constant(named)),
    parserArgs.fromStringParser
  )

export const alias =
  (...aliases: ReadonlyArray<Alias>) =>
  (fa: parserArgs.ParserArgs<Named>) =>
    pipe(
      parserString.shortFlags(aliases),
      parser.map(constant(named)),
      parserArgs.fromStringParser,
      parser.alt(() => fa)
    )

export const short =
  (...shorts: ReadonlyArray<string>) =>
  (fa: parserArgs.ParserArgs<Named>): parserArgs.ParserArgs<Named> =>
    pipe(
      parserString.shortFlags(shorts),
      parser.map(constant(named)),
      parserArgs.fromStringParser,
      parser.alt(() => fa)
    )

export const required = (
  fa: parserArgs.ParserArgs<Named>
): parserArgs.ParserArgs<Valued<true>> =>
  pipe(fa, parser.cut, parser.map(constant(valued(true))))

export const optional = (
  fa: parserArgs.ParserArgs<Named>
): parserArgs.ParserArgs<Valued<boolean>> =>
  pipe(
    fa,
    parser.optional,
    parser.map(option.match(constFalse, constTrue)),
    parser.map(valued)
  )

export interface Argument<A> extends reader.Reader<string, A> {}

export const argument = (
  fa: parserArgs.ParserArgs<Valued<boolean>>
): parserArgs.ParserArgs<string> =>
  pipe(fa, parser.apSecond(parserArgs.argument))

export const argumental = (
  fa: parserArgs.ParserArgs<Valued<boolean>>
): parserArgs.ParserArgs<option.Option<string>> =>
  pipe(fa, parser.apSecond(parser.optional(parserArgs.argument)))
