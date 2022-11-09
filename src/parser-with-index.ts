import { either, option } from "fp-ts"
import { Alt3 } from "fp-ts/lib/Alt"
import { Alternative3 } from "fp-ts/lib/Alternative"
import { Applicative3 } from "fp-ts/lib/Applicative"
import { Apply3 } from "fp-ts/lib/Apply"
import { Chain3 } from "fp-ts/lib/Chain"
import { Either } from "fp-ts/lib/Either"
import { flow, Lazy, pipe } from "fp-ts/lib/function"
import { Functor3 } from "fp-ts/lib/Functor"
import { HKT, Kind, URIS } from "fp-ts/lib/HKT"
import { Monad3 } from "fp-ts/lib/Monad"
import { Option } from "fp-ts/lib/Option"
import { Pointed3 } from "fp-ts/lib/Pointed"
import { Predicate } from "fp-ts/lib/Predicate"
import { Zero3 } from "fp-ts/lib/Zero"
import { Indexable, Indexable1 } from "./indexable"

export const URI = "ParserWithIndex"
export type URI = typeof URI

export interface StreamWithIndex<R, E> {
  readonly buffer: R
  readonly cursor: E
}

export interface ParseSuccessWithIndex<R, E, A> {
  readonly next: StreamWithIndex<R, E>
  readonly start: StreamWithIndex<R, E>
  readonly value: A
}

export interface ParseErrorWithIndex<R, E> {
  readonly expected: ReadonlyArray<string>
  readonly fatal: boolean
  readonly input: StreamWithIndex<R, E>
}

export type ParseResultWithIndex<R, E, A> = Either<
  ParseErrorWithIndex<R, E>,
  ParseSuccessWithIndex<R, E, A>
>

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
