import { either, option, readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { parser, parseResult, stream } from "parser-ts"

export type Arg = string
export type Args = ReadonlyArray<Arg>

export interface ParserArgs<A> extends parser.Parser<Args, A> {}

// export const URI = 'ParserArgs'

// export type URI = typeof URI
// declare module 'fp-ts/HKT'{
//   export interface URItoKind2<E,A>{
//     readonly[URI]:ParserArgs
//   }
// }

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
          stringParser,
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
