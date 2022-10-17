import { option } from "fp-ts"
import { constVoid, pipe } from "fp-ts/lib/function"
import { Monoid } from "fp-ts/lib/Monoid"
import { parser } from "parser-ts"

export * from "parser-ts/Parser"

export const expected =
  (message: string) =>
  <I, A>(p: parser.Parser<I, A>) =>
    parser.expected(p, message)

/**
 * @summary
 * Fail a parser if it matches.
 */
export const invert =
  (message: string) =>
  <I, A>(p: parser.Parser<I, A>): parser.Parser<I, void> =>
    pipe(
      p,
      parser.optional,
      parser.chain(
        option.match(
          () => parser.succeed<I, void>(constVoid()),
          () => parser.zero()
        )
      ),
      expected(message)
    )

export const getAltMonoid = <I, A>(): Monoid<parser.Parser<I, A>> => ({
  concat: (x, y) => pipe(parser.either(x, () => y)),
  empty: parser.zero<I, A>(),
})
