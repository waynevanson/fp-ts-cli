import { either, option, readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { Monoid } from "fp-ts/lib/Monoid"
import { char, parser, parseResult, stream, string } from "parser-ts"
import { expected, getAltMonoid } from "../fp/parser/parser"

export type Arg = string
export type Args = ReadonlyArray<Arg>

export interface ParserArgs<A> extends parser.Parser<Args, A> {}

export const fromStringParser =
  <A>(stringParser: parser.Parser<string, A>): ParserArgs<A> =>
  (i) =>
    pipe(
      stream.getAndNext(i),
      option.map(({ next, value }) =>
        pipe(
          value,
          readonlyArray.toArray,
          stream.stream,
          pipe(stringParser, parser.apFirst(parser.eof())),
          either.map((success) => parseResult.success(success.value, next, i)),
          either.getOrElse((error) =>
            parseResult.error(i, error.expected, error.fatal)
          )
        )
      ),
      option.getOrElse(() => parseResult.error(i))
    )

export const argument = pipe(
  parser.item<Args>(),
  parser.map((chars): Arg => chars.join(""))
)

export const longFlag = (long: string) =>
  pipe(
    string.string("--"),
    parser.apSecond(string.string(long)),
    fromStringParser,
    expected("longFlag")
  )

export const shortFlag = (short: string) =>
  pipe(
    char.char("-"),
    parser.apSecond(char.char(short)),
    fromStringParser,
    expected("shortFlag")
  )

export const monoidAltString = getAltMonoid<Args, string>()

export const shortFlags = readonlyArray.foldMap(monoidAltString)(shortFlag)

export const longFlags = readonlyArray.foldMap(monoidAltString)(longFlag)
