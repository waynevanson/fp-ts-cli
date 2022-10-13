import {
  either,
  identity,
  monoid,
  readonlyArray,
  readonlyRecord,
  readonlyTuple,
  separated,
  state,
  string,
} from "fp-ts"
import { flow, pipe, tuple } from "fp-ts/lib/function"
import { iso, Newtype } from "newtype-ts"
import * as flag from "./flag"
import * as parserString from "./string"
import * as parserArgs from "./args"
import { parser, parseResult, stream } from "parser-ts"
import { tailRec } from "fp-ts/lib/ChainRec"
import { Environment } from ".."

export interface Command
  extends Newtype<{ readonly Command: unique symbol }, void> {}

export const command_ = iso<Command>().from()

type Error = readonly [string, parseResult.ParseError<ReadonlyArray<string>>]
type Require = readonly [
  string,
  parseResult.ParseSuccess<ReadonlyArray<string>, any>
]
type Optional = readonly [
  string,
  parseResult.ParseSuccess<ReadonlyArray<string>, any>
]

interface Statey {
  readonly errors: ReadonlyArray<Error>
  readonly requires: ReadonlyArray<Require>
  readonly optionals: ReadonlyArray<Optional>
}

const m = monoid.struct<Statey>({
  errors: readonlyArray.getMonoid<Error>(),
  requires: readonlyArray.getMonoid<Require>(),
  optionals: readonlyArray.getMonoid(),
})

const fromError = (error: Error): Statey => ({
  errors: readonlyArray.of(error),
  requires: readonlyArray.empty,
  optionals: readonlyArray.empty,
})

const fromRequire = (require_: Require): Statey => ({
  errors: readonlyArray.empty,
  requires: readonlyArray.of(require_),
  optionals: readonlyArray.empty,
})

const fromOptional = (optional: Optional): Statey => ({
  errors: readonlyArray.empty,
  requires: readonlyArray.empty,
  optionals: readonlyArray.of(optional),
})

const fromFlag = <A>(
  k: string,
  flag_: parseResult.ParseResult<ReadonlyArray<string>, readonly [A, flag.Flag]>
): Statey =>
  pipe(
    flag_,
    either.map((a) =>
      a.value[1].flagged === flag.Flagged.Required
        ? fromRequire([k, a])
        : fromOptional([k, a])
    ),
    either.getOrElse((a) => fromError([k, a]))
  )

/**
 * @summary
 * Create a command from a single flag.
 *
 * @category Constructor
 */

const tap =
  <A, B = A>(f: (a: A) => B = (a) => a as any) =>
  (a: A): A => {
    console.log(f(a))
    return a
  }

const onErrorLast = (
  errors: ReadonlyArray<Error>,
  input: stream.Stream<ReadonlyArray<string>>
) =>
  either.right(
    parseResult.error(
      input,
      pipe(
        errors,
        readonlyArray.chain((a) => a[1].expected),
        readonlyArray.toArray
      ),
      true
    )
  )

const onSuccessRequiredFlag = (head: Require, state: Rec) =>
  either.left({
    complete: { ...state.complete, [head[0]]: head[1].value },
    input: head[1].next,
    remaining: pipe(state.remaining, readonlyRecord.deleteAt(head[0])),
  })

const onErrorRequiredFlag = (head: Require) =>
  either.right(parseResult.error(head[1].start, ["requiredFlag"], true))

const onSomeOptionals = (
  optionals: ReadonlyArray<Optional>,
  { complete, remaining }: Rec
) =>
  either.left({
    complete: {
      ...complete,
      ...pipe(
        optionals,
        readonlyArray.reduce({}, (b, a) => ({
          ...b,
          [a[0]]: a[1].value,
        }))
      ),
    },
    remaining: pipe(
      remaining,
      readonlyRecord.filterWithIndex((k) =>
        pipe(
          optionals,
          readonlyArray.some((a) => a[0] !== k)
        )
      )
    ),
    input: optionals[0][1].next,
  })

const onNothings = (start: stream.Stream<ReadonlyArray<string>>, rec: Rec) =>
  either.right(parseResult.success(rec.complete, rec.input, start))

const fromStatey =
  (
    start: stream.Stream<ReadonlyArray<string>>,
    { complete, input, remaining }: Rec
  ) =>
  ({ errors, optionals, requires }: Statey) =>
    pipe(
      requires,
      readonlyArray.matchLeft(
        () =>
          optionals.length === 0 && errors.length === 0
            ? onNothings(start, { complete, input, remaining })
            : optionals.length > 0
            ? onSomeOptionals(optionals, { complete, input, remaining })
            : onErrorLast(errors, input),
        (head, tail) =>
          tail.length === 0
            ? onSuccessRequiredFlag(head, {
                complete,
                input,
                remaining,
              }) // recurse to next rec
            : // fail because we couldn't extract a flag
              onErrorRequiredFlag(head)
      )
    )

const fromRec =
  (start: stream.Stream<ReadonlyArray<string>>) =>
  ({ complete, input, remaining }: Rec) =>
    pipe(
      remaining,
      readonlyRecord.flap(input),
      readonlyRecord.foldMapWithIndex(string.Ord)(m)(fromFlag),
      fromStatey(start, { complete, input, remaining })
    )

type Rec = {
  complete: Record<string, any>
  remaining: Record<string, flag.FlagParser<flag.Flag, any>>
  input: stream.Stream<ReadonlyArray<string>>
}
// if requires are !== 1, fatal cut
// if at end, use all optional values
// if all are errors, and any fatal, cut.
export const flags__ =
  <T extends Record<string, any>>(structs: {
    [P in keyof T]: flag.FlagParser<flag.Flag, T[P]>
  }): flag.FlagParser<Command, T> =>
  (start) => {
    // right is parseResult

    const result = pipe(
      tailRec(
        {
          complete: {} as Record<string, any>,
          remaining: structs as Record<string, flag.FlagParser<flag.Flag, any>>,
          input: start,
        } as Rec,
        fromRec(start)
      ),
      either.chain((t) =>
        parseResult.success(
          tuple(
            readonlyRecord.map((a) => (a as any)[0])(t.value as any) as never,
            command_
          ),
          t.next,
          t.start
        )
      )
    )

    return result
  }

// argument, can it go between flags? should be if we can.
// nonempty
export const subcommands = <T extends Record<string, any>>(sum: {
  [P in keyof T]: flag.FlagParser<Command, T[P]>
}): flag.FlagParser<
  Command,
  { [P in keyof T]: { _type: P; value: T[P] } }[keyof T]
> =>
  pipe(
    sum,
    readonlyRecord.fromRecord,
    readonlyRecord.mapWithIndex((_type, p) =>
      pipe(
        p,
        flag.map((value) => ({ _type, value }))
      )
    ),
    readonlyRecord.reduce(string.Ord)(
      parser.zero<ReadonlyArray<string>, any>(),
      (b, a) =>
        pipe(
          b,
          parser.alt(() => a)
        )
    )
  )

export const parse =
  (arguments_: Array<string>) =>
  <A>(
    command: flag.FlagParser<Command, A>
  ): parseResult.ParseResult<ReadonlyArray<string>, A> =>
    pipe(
      arguments_,
      readonlyArray.map((string) => string.split("")),
      readonlyArray.toArray,
      stream.stream,
      pipe(command, parser.map(readonlyTuple.fst))
    )

// how to parse arguments?
// if all flags fail, try arguments?
