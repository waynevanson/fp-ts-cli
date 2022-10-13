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
// if requires are !== 1, fatal cut
// if at end, use all optional values
// if all are errors, and any fatal, cut.
export const flags__ =
  <T extends Record<string, any>>(structs: {
    [P in keyof T]: flag.FlagParser<flag.Flag, T[P]>
  }): flag.FlagParser<Command, T> =>
  (start) => {
    // right is parseResult
    const a = tailRec(
      {
        complete: {} as Record<string, any>,
        remaining: structs as Record<string, flag.FlagParser<flag.Flag, any>>,
        input: start,
      },
      ({ complete, input, remaining }) =>
        pipe(
          remaining,
          readonlyRecord.flap(input),
          readonlyRecord.foldMapWithIndex(string.Ord)(m)(fromFlag),
          ({ errors, optionals, requires }) =>
            pipe(
              requires,
              readonlyArray.matchLeft(
                () =>
                  optionals.length === 0 && errors.length === 0
                    ? either.right(parseResult.success(complete, input, start))
                    : optionals.length > 0
                    ? either.left({
                        complete: {
                          ...complete,
                          ...pipe(
                            optionals,
                            readonlyArray.reduce({}, (b, a) => ({
                              ...b,
                              [a[0]]: a[1],
                            }))
                          ),
                        },
                        remaining: pipe(
                          remaining,
                          readonlyRecord.filterWithIndex((k) =>
                            pipe(
                              optionals,
                              readonlyArray.some((a) => a[0] === k)
                            )
                          )
                        ),
                        input,
                      })
                    : either.right(
                        parseResult.error(
                          input,
                          pipe(
                            errors,
                            readonlyArray.chain((a) => a[1].expected),
                            readonlyArray.toArray
                          ),
                          true
                        )
                      ),
                (head, tail) =>
                  tail.length === 0
                    ? // recurse to next rec
                      either.left({
                        complete: { ...complete, [head[0]]: head[1].value },
                        input: head[1].next,
                        remaining: pipe(
                          remaining,
                          readonlyRecord.deleteAt(head[0])
                        ),
                      })
                    : // fail because we couldn't extract a flag
                      either.right(
                        parseResult.error(head[1].start, ["requiredFlag"], true)
                      )
              )
            )
        )
    )

    const result = pipe(
      a,
      either.chain((t) =>
        parseResult.success(tuple(t.value as T, command_), t.next, t.start)
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
