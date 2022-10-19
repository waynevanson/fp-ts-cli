import { constant, constVoid, flow, pipe } from "fp-ts/lib/function"
import { Semigroup } from "fp-ts/lib/Semigroup"
import { either, identity, readonlyArray, readonlyNonEmptyArray } from "./fp"
import { char, parser, parseResult, stream } from "./fp/parser"

export interface Name {
  readonly longs: readonlyNonEmptyArray.ReadonlyNonEmptyArray<string>
  readonly shorts: ReadonlyArray<string>
}

const kebabCase = parser.sepBy1(char.char("-"), parser.many1(char.lower))

type Box<A> = either.Either<parseResult.ParseError<string>, A>

export function fromLong(long: string): Box<Name> {
  return pipe(
    identity.Do,
    identity.bind("stream", () => stream.stream(long.split(""))),
    identity.bind("parser", () =>
      pipe(
        kebabCase,
        parser.map((longs) => longs.join("")),
        parser.map(() => ({
          longs: readonlyNonEmptyArray.of(long),
          shorts: readonlyArray.empty,
        }))
      )
    ),
    identity.map(({ parser, stream }) => parser(stream)),
    either.map((success) => success.value)
  )
}

const v = <A>() =>
  either.getApplicativeValidation(
    readonlyNonEmptyArray.getSemigroup<parseResult.ParseError<A>>()
  )

const parseErrorSemigroup = <A>(): Semigroup<parseResult.ParseError<A>> => ({
  concat: parseResult.extend,
})

const manyStreamsOneParser = <I, A>(
  parseResults: ReadonlyArray<parseResult.ParseResult<I, A>>
) =>
  pipe(
    parseResults,
    readonlyArray.traverse(v<I>())(either.mapLeft(readonlyNonEmptyArray.of)),
    either.mapLeft(
      readonlyNonEmptyArray.foldMap(parseErrorSemigroup<I>())((e) => e)
    ),
    either.map(constVoid)
  )

export const shorts =
  (shorts: ReadonlyArray<string>) =>
  (fa: Name): Box<Name> =>
    pipe(
      identity.Do,
      identity.bind("parser", () => char.alphanum),
      identity.bind("streams", () =>
        pipe(
          shorts,
          readonlyArray.map((short) => short.split("")),
          readonlyArray.map(stream.stream)
        )
      ),
      identity.bind("shorts", () =>
        pipe(fa.shorts, readonlyArray.concat(shorts))
      ),
      identity.map(({ parser: parser_, streams, shorts }) =>
        pipe(
          streams,
          readonlyArray.map(parser_),
          manyStreamsOneParser,
          either.map(constant({ ...fa, shorts }))
        )
      )
    )

export const aliases =
  (longs: ReadonlyArray<string>) =>
  (fa: Name): Box<Name> =>
    pipe(
      identity.Do,
      identity.bind("parser", () => char.letter),
      identity.bind("streams", () =>
        pipe(
          longs,
          readonlyArray.map((short) => short.split("")),
          readonlyArray.map(stream.stream)
        )
      ),
      identity.bind("longs", () =>
        pipe(fa.longs, readonlyNonEmptyArray.concat(longs))
      ),
      identity.map(({ parser: parser_, streams, longs }) =>
        pipe(
          streams,
          readonlyArray.map(parser_),
          manyStreamsOneParser,
          either.map(constant({ ...fa, longs }))
        )
      )
    )
