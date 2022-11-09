import { HKT, Kind, URIS } from "fp-ts/lib/HKT"
import { Option } from "fp-ts/Option"

export interface Indexable<F, I> {
  readonly lookup: (index: I) => <A>(fa: HKT<F, A>) => Option<A>
  readonly next: (index: I) => <A>(fa: HKT<F, A>) => I
}

export interface Indexable1<F extends URIS, I> {
  readonly lookup: (index: I) => <A>(fa: Kind<F, A>) => Option<A>
  readonly next: (index: I) => <A>(fa: Kind<F, A>) => I
}
