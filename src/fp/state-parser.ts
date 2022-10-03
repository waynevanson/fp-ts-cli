import { ixStateT } from "fp-ts-indexed-monad"
import { Applicative4 } from "fp-ts/lib/Applicative"
import { Apply4 } from "fp-ts/lib/Apply"
import { Chain4 } from "fp-ts/lib/Chain"
import { flow, pipe } from "fp-ts/lib/function"
import { Functor4 } from "fp-ts/lib/Functor"
import { Monad4 } from "fp-ts/lib/Monad"
import { Pointed4 } from "fp-ts/lib/Pointed"
import { parser } from "parser-ts"

export const URI = "StateIndexedParser"
export type URI = typeof URI

export interface StateIndexedParser<S1, S2, I, A>
  extends ixStateT.IxStateT2<parser.URI, S1, S2, I, A> {}

declare module "fp-ts/HKT" {
  export interface URItoKind4<S, R, E, A> {
    readonly [URI]: StateIndexedParser<S, R, E, A>
  }
}

export const of = ixStateT.of(parser.Applicative)
export const ixof = ixStateT.ixof(parser.Applicative)
export const map = ixStateT.map(parser.Functor)
export const ixmap = ixStateT.ixmap(parser.Functor)
export const ap = ixStateT.ap(parser.Monad)
export const ixap = ixStateT.ixap(parser.Monad)
export const chain = ixStateT.chain(parser.Monad)
export const ixchain = ixStateT.ixchain(parser.Monad)
export const fromState = ixStateT.fromStateF<URI>()
export const fromStateParser = ixStateT.fromStateF<URI>()
export const evaluate = ixStateT.evaluate(parser.Functor)
export const ixexecute = ixStateT.ixexecute(parser.Functor)
export const ixmodify = ixStateT.ixmodify(parser.Applicative)
export const put = ixStateT.put(parser.Applicative)
export const ixchainFirst =
  <O, Z, E, A, B>(f: (a: A) => StateIndexedParser<O, Z, E, B>) =>
  <I>(fa: StateIndexedParser<I, O, E, A>): StateIndexedParser<I, Z, E, A> =>
    pipe(
      fa,
      ixchain((a) =>
        pipe(
          f(a),
          map(() => a)
        )
      )
    )

export const get: <S, I>() => StateIndexedParser<S, S, I, S> = ixStateT.get(
  parser.Applicative
)

export const gets: <S, I, A>(f: (s: S) => A) => StateIndexedParser<S, S, I, A> =
  ixStateT.gets(parser.Applicative)

export const Pointed: Pointed4<URI> = { URI, of: of as never }
export const Functor: Functor4<URI> = { URI, map: (fa, f) => map(f)(fa) }
export const Apply: Apply4<URI> = {
  ...Functor,
  ap: (fab, fa) => ixap(fa)(fab as never),
}
export const Applicative: Applicative4<URI> = { ...Pointed, ...Apply }
export const Chain: Chain4<URI> = {
  ...Apply,
  chain: (fa, f) => ixchain(f)(fa as never),
}
export const Monad: Monad4<URI> = { ...Chain, ...Applicative }

export const fromParser =
  <S, I, A>(fa: parser.Parser<I, A>): StateIndexedParser<S, S, I, A> =>
  (s) =>
    pipe(
      fa,
      parser.map((a) => [a, s])
    )
