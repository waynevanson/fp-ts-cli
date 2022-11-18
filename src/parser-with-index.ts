import { either, option } from "fp-ts"
import { Alt3 } from "fp-ts/lib/Alt"
import { Alternative3 } from "fp-ts/lib/Alternative"
import { Applicative3 } from "fp-ts/lib/Applicative"
import { Apply3 } from "fp-ts/lib/Apply"
import { Chain3 } from "fp-ts/lib/Chain"
import { PredicateWithIndex } from "fp-ts/lib/FilterableWithIndex"
import { flow, Lazy, pipe } from "fp-ts/lib/function"
import { Functor3 } from "fp-ts/lib/Functor"
import { HKT, Kind, URIS } from "fp-ts/lib/HKT"
import { Monad3 } from "fp-ts/lib/Monad"
import { Option } from "fp-ts/lib/Option"
import { Pointed3 } from "fp-ts/lib/Pointed"
import { Predicate } from "fp-ts/lib/Predicate"
import { Semigroup } from "fp-ts/lib/Semigroup"
import { Zero3 } from "fp-ts/lib/Zero"
import { Indexable, Indexable1 } from "./indexable"
import {
  ParseResultWithIndex,
  StreamWithIndex,
} from "./parse-result-with-index"
import * as parseResultWithIndex from "./parse-result-with-index"

export const URI = "ParserWithIndex"
export type URI = typeof URI

export interface ParserWithIndex<R, E, A> {
  (input: StreamWithIndex<R, E>): ParseResultWithIndex<R, E, A>
}

declare module "fp-ts/HKT" {
  export interface URItoKind3<R, E, A> {
    readonly [URI]: ParserWithIndex<R, E, A>
  }
}

export const of =
  <R, E, A>(a: A): ParserWithIndex<R, E, A> =>
  (input) =>
    either.right({ value: a, start: input, next: input })

export const Pointed: Pointed3<URI> = { URI, of }

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(fa: ParserWithIndex<R, E, A>): ParserWithIndex<R, E, B> =>
    flow(
      fa,
      either.map((success) => ({ ...success, value: f(success.value) }))
    )

export const Functor: Functor3<URI> = { URI, map: (fa, f) => map(f)(fa) }

export const ap =
  <R, E, A>(fa: ParserWithIndex<R, E, A>) =>
  <B>(fab: ParserWithIndex<R, E, (a: A) => B>): ParserWithIndex<R, E, B> =>
  (input) =>
    pipe(
      fab(input),
      either.chain(({ next, start, value: ab }) =>
        pipe(
          fa(next),
          either.map(({ value: a, next }) => ({ value: ab(a), start, next })),
          either.mapLeft((error) => ({ ...error, input: start }))
        )
      )
    )

export const Apply: Apply3<URI> = {
  ...Functor,
  ap: (fab, fa) => ap(fa)(fab),
}

export const chain =
  <R, E, A, B>(f: (a: A) => ParserWithIndex<R, E, B>) =>
  (fa: ParserWithIndex<R, E, A>): ParserWithIndex<R, E, B> =>
  (input) =>
    pipe(
      fa(input),
      either.chain((success) =>
        pipe(
          f(success.value)(success.next),
          either.map(({ value, next }) => ({ value, start: input, next })),
          either.mapLeft((error) => ({ ...error, input }))
        )
      )
    )

export const Chain: Chain3<URI> = { ...Apply, chain: (fa, f) => chain(f)(fa) }

export const Applicative: Applicative3<URI> = { ...Apply, ...Pointed }

export const Monad: Monad3<URI> = { ...Applicative, ...Chain }

export const alt =
  <R, E, A>(that: Lazy<ParserWithIndex<R, E, A>>) =>
  (fa: ParserWithIndex<R, E, A>): ParserWithIndex<R, E, A> =>
  (input) =>
    pipe(
      fa(input),
      either.swap,
      either.chain(() => pipe(that()(input), either.swap)),
      either.swap
    )

export const Alt: Alt3<URI> = { ...Functor, alt: (fa, that) => alt(that)(fa) }

export const zero =
  <R, E, A>(): ParserWithIndex<R, E, A> =>
  (input) =>
    either.left({ input, fatal: false, expected: [] })

export const Zero: Zero3<URI> = { URI, zero }

export const Alternative: Alternative3<URI> = {
  ...Applicative,
  ...Alt,
  ...Zero,
}

export function getItem<F extends URIS, E>(
  Indexable: Indexable1<F, E>
): <R>() => ParserWithIndex<Kind<F, R>, E, R>
export function getItem<F, E>(
  Indexable: Indexable<F, E>
): <R>() => ParserWithIndex<HKT<F, R>, E, R>
export function getItem<F, E>(
  Indexable: Indexable<F, E>
): <R>() => ParserWithIndex<HKT<F, R>, E, R> {
  return () => (input) =>
    pipe(
      input.buffer,
      Indexable.lookup(input.cursor),
      option.map((value) => ({
        value,
        start: input,
        next: {
          buffer: input.buffer,
          cursor: Indexable.next(input.cursor)(input.buffer),
        },
      })),
      either.fromOption(() => ({
        fatal: false,
        input,
        expected: [],
      }))
    )
}

export function getItemWithIndex<F extends URIS, E>(
  Indexable: Indexable1<F, E>
): <R>() => ParserWithIndex<Kind<F, R>, E, { value: R; index: E }>
export function getItemWithIndex<F, E>(
  Indexable: Indexable<F, E>
): <R>() => ParserWithIndex<HKT<F, R>, E, { value: R; index: E }>
export function getItemWithIndex<F, E>(
  Indexable: Indexable<F, E>
): <R>() => ParserWithIndex<HKT<F, R>, E, { value: R; index: E }> {
  return () => (input) =>
    pipe(
      input.buffer,
      Indexable.lookup(input.cursor),
      option.map((value) => ({
        value,
        start: input,
        next: {
          buffer: input.buffer,
          cursor: Indexable.next(input.cursor)(input.buffer),
        },
      })),
      either.fromOption(() => ({
        fatal: false,
        input,
        expected: [],
      })),
      either.map(({ next, start, value }) => ({
        value: { value, index: input.cursor },
        start,
        next,
      }))
    )
}

export function getSat<F extends URIS, E>(
  Indexable: Indexable1<F, E>
): <R>(f: Predicate<R>) => ParserWithIndex<Kind<F, R>, E, R>
export function getSat<F, E>(
  Indexable: Indexable<F, E>
): <R>(f: Predicate<R>) => ParserWithIndex<HKT<F, R>, E, R>
export function getSat<F, E>(
  Indexable: Indexable<F, E>
): <R>(f: Predicate<R>) => ParserWithIndex<HKT<F, R>, E, R> {
  return <R>(f: Predicate<R>): ParserWithIndex<HKT<F, R>, E, R> =>
    pipe(
      getItem(Indexable)<R>(),
      chain((value) => (f(value) ? of(value) : zero()))
    )
}

export function takeUntilWithIndex<F extends URIS, E>(
  Indexable: Indexable1<F, E>
): <R>(
  f: PredicateWithIndex<E, R>
) => ParserWithIndex<Kind<F, R>, E, ReadonlyArray<R>>
export function takeUntilWithIndex<F, E>(
  Indexable: Indexable<F, E>
): <R>(
  f: PredicateWithIndex<E, R>
) => ParserWithIndex<HKT<F, R>, E, ReadonlyArray<R>>

export function takeUntilWithIndex<F, E>(
  Indexable: Indexable<F, E>
): <R>(
  f: PredicateWithIndex<E, R>
) => ParserWithIndex<HKT<F, R>, E, ReadonlyArray<R>> {
  return <R>(
      predicateWithIndex: PredicateWithIndex<E, R>
    ): ParserWithIndex<HKT<F, R>, E, ReadonlyArray<R>> =>
    (input) => {
      const value: Array<R> = []

      let index = input.cursor
      let next = input.buffer
      let a: R

      do {
        const c = Indexable.lookup(index)(next)

        if (option.isNone(c)) {
          return parseResultWithIndex.error({ buffer: next, cursor: index })
        }

        a = c.value
        index = Indexable.next(index)(next)
        value.push(a)
      } while (predicateWithIndex(index, a))

      return either.right({
        value: value as ReadonlyArray<R>,
        next: parseResultWithIndex.stream(next, index),
        start: input,
      })
    }
}

export const optional = <R, E, A>(
  fa: ParserWithIndex<R, E, A>
): ParserWithIndex<R, E, Option<A>> =>
  flow(
    fa,
    either.match(
      (error) =>
        either.right({
          value: option.none,
          start: error.input,
          next: error.input,
        }),
      (success) =>
        either.right({ ...success, value: option.some(success.value) })
    )
  )

export const expected =
  (message: string) =>
  <R, E, A>(fa: ParserWithIndex<R, E, A>): ParserWithIndex<R, E, A> =>
    flow(
      fa,
      either.mapLeft((error) => ({ ...error, expected: [message] }))
    )

export const getAltSemigroup = <R, E, A>(): Semigroup<
  ParserWithIndex<R, E, A>
> => ({
  concat: (x, y) =>
    pipe(
      x,
      alt(() => y)
    ),
})
