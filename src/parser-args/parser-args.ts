import { either } from "fp-ts";
import { Alt1 } from "fp-ts/lib/Alt";
import { Alternative1 } from "fp-ts/lib/Alternative";
import { Applicative1 } from "fp-ts/lib/Applicative";
import { Apply1 } from "fp-ts/lib/Apply";
import { Chain1 } from "fp-ts/lib/Chain";
import { tailRec } from "fp-ts/lib/ChainRec";
import { PredicateWithIndex } from "fp-ts/lib/FilterableWithIndex";
import { flow, Lazy, pipe } from "fp-ts/lib/function";
import { Functor1 } from "fp-ts/lib/Functor";
import { Monad1 } from "fp-ts/lib/Monad";
import { Pointed1 } from "fp-ts/lib/Pointed";
import { Predicate } from "fp-ts/lib/Predicate";
import { Semigroup } from "fp-ts/lib/Semigroup";
import { Zero1 } from "fp-ts/lib/Zero";
import { Option } from "fp-ts/Option";
import * as parseResultWithIndex from "./parse-result-with-index";
import * as parserWithIndex from "./parser-with-index";
import {
  Index,
  Indexable,
  ReadonlyArrayReadonlyArray,
} from "./readonly-array-readonly-array";

export const URI = "ParserArgs";
export type URI = typeof URI;
export type Input = ReadonlyArrayReadonlyArray<string>;

export interface ParserArgs<A>
  extends parserWithIndex.ParserWithIndex<Input, Index, A> {}

declare module "fp-ts/HKT" {
  export interface URItoKind<A> {
    readonly [URI]: ParserArgs<A>;
  }
}

export const of: <A>(a: A) => ParserArgs<A> = parserWithIndex.of;

export const Pointed: Pointed1<URI> = { URI, of };

export const map: <A, B>(
  f: (a: A) => B
) => (fa: ParserArgs<A>) => ParserArgs<B> = parserWithIndex.map;

export const Functor: Functor1<URI> = { URI, map: (fa, f) => map(f)(fa) };

export const ap: <A>(
  fa: ParserArgs<A>
) => <B>(fab: ParserArgs<(a: A) => B>) => ParserArgs<B> = parserWithIndex.ap;

export const Apply: Apply1<URI> = { ...Functor, ap: (fab, fa) => ap(fa)(fab) };

export const Applicative: Applicative1<URI> = { ...Apply, ...Pointed };

export const chain: <A, B>(
  f: (a: A) => ParserArgs<B>
) => (fa: ParserArgs<A>) => ParserArgs<B> = parserWithIndex.chain;

export const Chain: Chain1<URI> = {
  ...Apply,
  chain: (fa, f) => chain(f)(fa),
};

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Applicative,
};

export const inner: ParserArgs<string> = parserWithIndex.getItem(Indexable)();
export const innerWithIndex = parserWithIndex.getItemWithIndex(Indexable)();

export const sat: (f: Predicate<string>) => ParserArgs<string> =
  parserWithIndex.getSat(Indexable);

export const optional: <A>(fa: ParserArgs<A>) => ParserArgs<Option<A>> =
  parserWithIndex.optional;

export const zero: <A>() => ParserArgs<A> = parserWithIndex.zero;

export const Zero: Zero1<URI> = { URI, zero };

export const alt: <A>(
  that: Lazy<ParserArgs<A>>
) => (fa: ParserArgs<A>) => ParserArgs<A> = parserWithIndex.alt;

export const Alt: Alt1<URI> = { ...Functor, alt: (fa, that) => alt(that)(fa) };

export const Alternative: Alternative1<URI> = {
  ...Zero,
  ...Applicative,
  ...Alt,
};

export const char = (char: string): ParserArgs<string> =>
  sat((string) => string === char[0]);

export const outer: ParserArgs<string> = (start) =>
  tailRec(
    {
      next: start,
      start,
      value: "",
    } as parseResultWithIndex.ParseSuccessWithIndex<Input, Index, string>,
    (success) =>
      pipe(
        success.next,
        //maybe
        map((value) => success.value + value)(inner),
        either.match(
          flow(either.left, either.right),
          flow(
            either.fromPredicate(
              (success) =>
                success.next.cursor.outer > success.start.cursor.outer,
              (e) => e
            ),
            either.map((a) => either.right(a))
          )
        )
      )
  );

export const getAltSemigroup = <A>(): Semigroup<ParserArgs<A>> =>
  parserWithIndex.getAltSemigroup();

export const takeUntilWithIndex: (
  f: PredicateWithIndex<Index, string>
) => ParserArgs<ReadonlyArray<string>> =
  parserWithIndex.takeUntilWithIndex(Indexable);
