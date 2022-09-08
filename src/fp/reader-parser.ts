import { reader, readerT } from "fp-ts";
import { Applicative3 } from "fp-ts/lib/Applicative";
import { Apply3 } from "fp-ts/lib/Apply";
import { Chain3 } from "fp-ts/lib/Chain";
import { Functor3 } from "fp-ts/lib/Functor";
import { Monad3 } from "fp-ts/lib/Monad";
import { Pointed3 } from "fp-ts/lib/Pointed";
import { parser } from "parser-ts";

export const URI = "ReaderParser";
export type URI = typeof URI;

export interface ReaderParser<R, I, A>
  extends reader.Reader<R, parser.Parser<I, A>> {}

declare module "fp-ts/HKT" {
  export interface URItoKind3<R, E, A> {
    readonly [URI]: ReaderParser<R, E, A>;
  }
}

export const map = readerT.map(parser.Functor);
export const ap = readerT.ap(parser.Applicative);
export const of = readerT.of(parser.Monad);
export const chain = readerT.chain(parser.Monad);
export const fromReader = readerT.fromReader(parser.Monad);
export const fromParser =
  <I, A, R>(p: parser.Parser<I, A>): ReaderParser<R, I, A> =>
  () =>
    p;
export const Pointed: Pointed3<URI> = { URI, of };
export const Functor: Functor3<URI> = { URI, map: (fa, f) => map(f)(fa) };
export const Apply: Apply3<URI> = { ...Functor, ap: (fab, fa) => ap(fa)(fab) };
export const Chain: Chain3<URI> = { ...Apply, chain: (fa, f) => chain(f)(fa) };
export const Applicative: Applicative3<URI> = { ...Apply, ...Pointed };
export const Monad: Monad3<URI> = { ...Applicative, ...Chain };
