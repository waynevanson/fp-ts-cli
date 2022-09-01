import { reader, stateT } from "fp-ts";
import { Applicative4 } from "fp-ts/lib/Applicative";
import { Apply4 } from "fp-ts/lib/Apply";
import { Chain4 } from "fp-ts/lib/Chain";
import { Functor4 } from "fp-ts/lib/Functor";
import { Monad4 } from "fp-ts/lib/Monad";
import { NaturalTransformation24 } from "fp-ts/lib/NaturalTransformation";
import { Pointed4 } from "fp-ts/lib/Pointed";
import * as readerParser from "./reader-parser";
import { parser } from "parser-ts";
import { Endomorphism } from "fp-ts/lib/Endomorphism";
import { pipe } from "fp-ts/lib/function";

export const URI = "StateReaderParser";
export type URI = typeof URI;

export interface StateReaderParser<S, R, I, A>
  extends stateT.StateT3<readerParser.URI, S, R, I, A> {}

declare module "fp-ts/HKT" {
  export interface URItoKind4<S, R, E, A> {
    readonly [URI]: StateReaderParser<S, R, E, A>;
  }
}

export const of = stateT.of(readerParser.Pointed);
export const map = stateT.map(readerParser.Functor);
export const ap = stateT.ap(readerParser.Chain);
export const chain = stateT.chain(readerParser.Chain);
export const fromState = stateT.fromState(readerParser.Pointed);
export const fromReaderParser = stateT.fromF(readerParser.Functor);
export const evaluate = stateT.evaluate(readerParser.Functor);
export const execute = stateT.execute(readerParser.Functor);

export const get =
  <S, R, I>(): StateReaderParser<S, R, I, S> =>
  (s) =>
    readerParser.of([s, s]);

export const gets =
  <S, A, R, I>(f: (s: S) => A): StateReaderParser<S, R, I, A> =>
  (s) =>
    readerParser.of([f(s), s]);

export const Pointed: Pointed4<URI> = { URI, of };
export const Functor: Functor4<URI> = { URI, map: (fa, f) => map(f)(fa) };
export const Apply: Apply4<URI> = { ...Functor, ap: (fab, fa) => ap(fa)(fab) };
export const Applicative: Applicative4<URI> = { ...Pointed, ...Apply };
export const Chain: Chain4<URI> = {
  ...Apply,
  chain: (fa, f) => chain(f)(fa),
};
export const Monad: Monad4<URI> = { ...Chain, ...Applicative };

export const FromParser: NaturalTransformation24<parser.URI, URI> = (fa) =>
  fromReaderParser(readerParser.fromParser(fa));
