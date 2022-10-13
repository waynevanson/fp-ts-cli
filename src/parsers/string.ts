import { readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { Monoid } from "fp-ts/lib/Monoid"
import { char, parser, string } from "parser-ts"

export const expected =
  (message: string) =>
  <I, A>(p: parser.Parser<I, A>) =>
    parser.expected(p, message)

export const dash = pipe(char.char("-"), expected("dash"))

export const doubleDash = pipe(string.string("--"), expected("doubleDash"))

export const longFlag = (long: string) =>
  pipe(doubleDash, parser.apSecond(string.string(long)), expected("longFlag"))

export const shortFlag = (short: string) =>
  pipe(dash, parser.apSecond(char.char(short)), expected("shortFlag"))

export const getAltMonoid = <I, A>(): Monoid<parser.Parser<I, A>> => ({
  concat: (x, y) => pipe(parser.either(x, () => y)),
  empty: parser.zero<I, A>(),
})

export const monoidAltString = getAltMonoid<string, string>()

export const shortFlags = readonlyArray.foldMap(monoidAltString)(shortFlag)

export const longFlags = readonlyArray.foldMap(monoidAltString)(longFlag)
