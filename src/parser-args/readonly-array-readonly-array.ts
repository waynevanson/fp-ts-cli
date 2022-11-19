import { option, readonlyArray } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { Indexable1 } from "./indexable";
import * as outerinner from "./outer-inner";
import { OuterInner } from "./outer-inner";

export const URI = "ReadonlyArrayReadonlyArray";

export type URI = typeof URI;
export type ReadonlyArrayReadonlyArray<A> = ReadonlyArray<ReadonlyArray<A>>;

declare module "fp-ts/HKT" {
  export interface URItoKind<A> {
    readonly [URI]: ReadonlyArrayReadonlyArray<A>;
  }
}

export type Index = OuterInner;

const lookup: Indexable1<URI, Index>["lookup"] = (index) => (fa) =>
  pipe(
    fa,
    readonlyArray.lookup(index.outer),
    option.chain(readonlyArray.lookup(index.inner))
  );

export const Indexable: Indexable1<URI, Index> = {
  lookup: lookup,
  next: (index) => (fa) => {
    const nextInner = outerinner.incrementInner(index);
    const nextOuter = outerinner.incrementOuter(index);
    return pipe(
      fa,
      lookup(nextInner),
      option.map(() => nextInner),
      option.getOrElse(() => nextOuter)
    );
  },
};
