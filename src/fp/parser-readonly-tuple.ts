import { apply, either, functor, readonlyTuple } from "fp-ts"
import { Applicative3C } from "fp-ts/lib/Applicative"
import { Apply3C } from "fp-ts/lib/Apply"
import { Chain3C } from "fp-ts/lib/Chain"
import { ChainRec3C } from "fp-ts/lib/ChainRec"
import { pipe, tuple } from "fp-ts/lib/function"
import { Functor3 } from "fp-ts/lib/Functor"
import { Monad3C } from "fp-ts/lib/Monad"
import { Monoid } from "fp-ts/lib/Monoid"
import { Pointed3C } from "fp-ts/lib/Pointed"
import { Semigroup } from "fp-ts/lib/Semigroup"
import { parser } from "parser-ts"

export interface ParserReadonlyTuple<R, E, A>
  extends parser.Parser<R, readonly [A, E]> {}

export const URI = "ParserReadonlyTuple"
export type URI = typeof URI

declare module "fp-ts/HKT" {
  export interface URItoKind3<R, E, A> {
    readonly [URI]: ParserReadonlyTuple<R, E, A>
  }
}

export const getPointed = <E>(M: Monoid<E>) =>
  ({
    URI: URI,
    of: (a) => parser.of(tuple(a, M.empty)),
  } as Pointed3C<URI, E>)

export const mapFst = functor.map(parser.Functor, readonlyTuple.Functor)

export const Functor: Functor3<URI> = { URI, map: (fa, f) => mapFst(f)(fa) }

export const getApply = <E>(S: Semigroup<E>) => {
  const Apply = readonlyTuple.getApply(S)
  const ap = apply.ap(parser.Applicative, Apply)
  return {
    ...Functor,
    ap: (fab, fa) => ap(fa)(fab),
  } as Apply3C<URI, E>
}

export const getApplicative = <E>(M: Monoid<E>) => {
  const Apply = readonlyTuple.getApply(M)
  const { of } = getPointed(M)
  const ap = apply.ap(parser.Applicative, Apply)
  return {
    ...Functor,
    of,
    ap: (fab, fa) => ap(fa)(fab),
  } as Applicative3C<URI, E>
}

export const getChain = <E>(S: Semigroup<E>) => {
  const Apply = getApply(S)
  const chain: Chain3C<URI, E>["chain"] = (fa, f) =>
    pipe(
      fa,
      parser.chain(([a1, e1]) =>
        pipe(f(a1), parser.map(readonlyTuple.mapSnd((e2) => S.concat(e1, e2))))
      )
    )

  return {
    ...Functor,
    ...Apply,
    chain,
  } as Chain3C<URI, E>
}

export const getMonad = <E>(M: Monoid<E>): Monad3C<URI, E> => ({
  ...getChain(M),
  ...getPointed(M),
})

export const bimap =
  <E1, E2, A1, A2>(g: (e: E1) => E2, f: (a: A1) => A2) =>
  <R>(fa: ParserReadonlyTuple<R, E1, A1>): ParserReadonlyTuple<R, E2, A2> =>
    pipe(fa, parser.map(readonlyTuple.bimap(g, f)))

export const mapSnd =
  <E1, E2>(g: (e: E1) => E2) =>
  <R, A>(fa: ParserReadonlyTuple<R, E1, A>): ParserReadonlyTuple<R, E2, A> =>
    pipe(fa, parser.map(readonlyTuple.mapSnd(g)))

export const getChainRec = <E>(S: Semigroup<E>): ChainRec3C<URI, E> => {
  const Chain = getChain(S)
  return {
    ...Chain,
    chainRec: (a, f) =>
      parser.ChainRec.chainRec(a, (a) =>
        pipe(f(a), parser.map(readonlyTuple.sequence(either.Applicative)))
      ),
  }
}

export const flap = functor.flap(parser.Functor)
