import { either, option, readonlyArray } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { parser, parseResult, stream } from "parser-ts";

export interface ParserArgs<A>
  extends parser.Parser<ReadonlyArray<string>, A> {}

export function fromParserString<A>(
  fa: parser.Parser<string, A>
): ParserArgs<A> {
  return (start) =>
    pipe(
      start,
      stream.getAndNext,
      option.map(({ next, value }) =>
        pipe(
          value,
          readonlyArray.toArray,
          stream.stream,
          fa,
          either.map(({ value }) => parseResult.success(value, next, start)),
          either.getOrElse(({ expected, fatal }) =>
            parseResult.error(start, expected, fatal)
          )
        )
      ),
      option.getOrElse(() => parseResult.error(start, ['"parser-string"']))
    );
}
