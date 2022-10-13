import {
  either,
  monoid,
  option,
  reader,
  readonlyArray,
  readonlyRecord,
  semigroup,
  string,
} from "fp-ts"
import { tailRec } from "fp-ts/lib/ChainRec"
import { constTrue, pipe, unsafeCoerce, tuple } from "fp-ts/lib/function"
import { parseResult, stream } from "parser-ts"
import { Command, command_ } from "."
import * as flag from "../flag"

export interface Rec {
  complete: Record<string, any>
  remaining: Record<string, flag.FlagParser<flag.Flag, any>>
  input: stream.Stream<ReadonlyArray<string>>
}

export type ReaderRec<A> = reader.Reader<Rec, A>

type Error = parseResult.ParseError<ReadonlyArray<string>>

type Require = parseResult.ParseSuccess<
  ReadonlyArray<string>,
  readonly [any, flag.Flag]
>

type Optional = parseResult.ParseSuccess<
  ReadonlyArray<string>,
  readonly [any, flag.Flag]
>

// todo - rework as records
export interface Statey {
  readonly errors: readonlyRecord.ReadonlyRecord<string, Error>
  readonly requires: readonlyRecord.ReadonlyRecord<string, Require>
  readonly optionals: readonlyRecord.ReadonlyRecord<string, Require>
}

const m = monoid.struct<Statey>({
  errors: readonlyRecord.getMonoid(semigroup.last()),
  requires: readonlyRecord.getMonoid(semigroup.last()),
  optionals: readonlyRecord.getMonoid(semigroup.last()),
})

const fromError = (k: string, error: Error): Statey => ({
  errors: readonlyRecord.singleton(k, error),
  requires: {},
  optionals: {},
})

const fromRequire = (k: string, require_: Require): Statey => ({
  errors: {},
  requires: readonlyRecord.singleton(k, require_),
  optionals: {},
})

const fromOptional = (k: string, optional: Optional): Statey => ({
  errors: {},
  requires: {},
  optionals: readonlyRecord.singleton(k, optional),
})

const fromFlag = <A>(
  k: string,
  flag_: parseResult.ParseResult<ReadonlyArray<string>, readonly [A, flag.Flag]>
): Statey =>
  pipe(
    flag_,
    either.map((a) =>
      a.value[1].flagged === flag.Flagged.Required
        ? fromRequire(k, a)
        : fromOptional(k, a)
    ),
    either.getOrElse((a) => fromError(k, a))
  )

const onErrorLast =
  (
    errors: readonlyRecord.ReadonlyRecord<string, Error>
  ): ReaderRec<parseResult.ParseResult<ReadonlyArray<string>, never>> =>
  (rec) =>
    parseResult.error(
      rec.input,
      pipe(
        errors,
        readonlyRecord.toReadonlyArray,
        readonlyArray.chain((a) => a[1].expected),
        readonlyArray.toArray
      ),
      true
    )

// remove key from remaining
// add key to complete
const onRequired =
  (k: string, head: Require): ReaderRec<Rec> =>
  (rec) => ({
    complete: { ...rec.complete, [k]: head.value[0] },
    input: head.next,
    remaining: pipe(rec.remaining, readonlyRecord.deleteAt(k)),
  })

const onErrorRequiredFlag = (head: Require) =>
  parseResult.error(head.start, ["requiredFlag"], true)

const onSomeOptionals =
  (
    optionals: readonlyRecord.ReadonlyRecord<string, Optional>
  ): ReaderRec<Rec> =>
  (rec) => ({
    // add optionals
    complete: {
      ...rec.complete,
      ...pipe(
        optionals,
        readonlyRecord.map((a) => a.value[0])
      ),
    },
    // remove optional keys from the remaining
    remaining: pipe(
      rec.remaining,
      readonlyRecord.filterWithIndex((k) => !readonlyRecord.has(k, optionals))
    ),
    // since there is at least one optiona, we should use that next stream
    input: pipe(
      optionals,
      readonlyRecord.toReadonlyArray,
      readonlyArray.findFirst(constTrue),
      //@ts-expect-error
      (a) => unsafeCoerce(a.value) as readonly [string, Optional],
      (a) => a[1].next
    ),
  })

const onCompletelyParsed =
  (
    start: stream.Stream<ReadonlyArray<string>>
  ): ReaderRec<parseResult.ParseResult<ReadonlyArray<string>, any>> =>
  (rec) =>
    parseResult.success(rec.complete, rec.input, start)

const fromStatey =
  (start: stream.Stream<ReadonlyArray<string>>) =>
  ({
    errors,
    optionals,
    requires,
  }: Statey): ReaderRec<
    either.Either<
      Rec,
      parseResult.ParseResult<
        ReadonlyArray<string>,
        readonlyRecord.ReadonlyRecord<string, any>
      >
    >
  > =>
    pipe(
      requires,
      readonlyRecord.toReadonlyArray,
      readonlyArray.matchLeft(
        () =>
          readonlyRecord.size(optionals) === 0 &&
          readonlyRecord.size(errors) === 0
            ? either.right(onCompletelyParsed(start))
            : readonlyRecord.size(optionals) > 0
            ? either.left(onSomeOptionals(optionals))
            : either.right(onErrorLast(errors)),
        ([k, head], tail) =>
          tail.length === 0
            ? either.left(onRequired(k, head))
            : either.right(reader.of(onErrorRequiredFlag(head)))
      ),
      either.matchW(reader.map(either.left), reader.map(either.right))
    )

const fromRec = (
  start: stream.Stream<ReadonlyArray<string>>
): ReaderRec<
  either.Either<
    Rec,
    parseResult.ParseResult<
      ReadonlyArray<string>,
      readonlyRecord.ReadonlyRecord<string, any>
    >
  >
> =>
  pipe(
    reader.ask<Rec>(),
    reader.map((rec) =>
      pipe(
        rec.remaining,
        readonlyRecord.flap(rec.input),
        readonlyRecord.foldMapWithIndex(string.Ord)(m)(fromFlag)
      )
    ),
    reader.chain(fromStatey(start))
  )

const mapParseResult =
  <A, B>(f: (a: A) => B) =>
  <E>(fa: parseResult.ParseResult<E, A>): parseResult.ParseResult<E, B> =>
    pipe(
      fa,
      either.chain((success) =>
        parseResult.success(f(success.value), success.next, success.start)
      )
    )

/**
 * @summary
 * Create a command from a single flag.
 *
 * @category Constructor
 */
export const flags =
  <T extends Record<string, any>>(structs: {
    [P in keyof T]: flag.FlagParser<flag.Flag, T[P]>
  }): flag.FlagParser<Command, T> =>
  (start) =>
    //@ts-ignore
    pipe(
      tailRec(
        {
          complete: {},
          remaining: structs as readonlyRecord.ReadonlyRecord<
            string,
            flag.FlagParser<flag.Flag, any>
          >,
          input: start,
        },
        fromRec(start)
      ),
      mapParseResult((t) => tuple(t, command_))
    )
