import { either, option, readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { parser, parseResult, stream } from "parser-ts"

export interface ParserArgs<A>
  extends parser.Parser<ReadonlyArray<string>, A> {}

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
  parser.item<ReadonlyArray<string>>(),
  parser.map((chars) => chars.join(""))
)
