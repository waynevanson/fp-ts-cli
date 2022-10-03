import { readonlyArray } from "fp-ts"
import { pipe } from "fp-ts/lib/function"

export type Long = string
export type Alias = string
export type Short = string

export interface Identifier<
  L extends Long,
  A extends Alias = never,
  S extends Short = never
> {
  readonly long: L
  readonly aliases: ReadonlyArray<A>
  readonly shorts: ReadonlyArray<S>
}

export const long = <L extends Long>(long: L): Identifier<L> => ({
  aliases: [],
  long,
  shorts: [],
})

export const alias =
  <A2 extends Alias>(aliases: ReadonlyArray<A2>) =>
  <L extends Long, A1 extends Alias, S extends Short>(
    fa: Identifier<L, A1, S>
  ): Identifier<L, A1 | A2, S> =>
    pipe(fa.aliases, readonlyArray.concatW(aliases), (aliases) => ({
      ...fa,
      aliases,
    }))

export const short =
  <S2 extends Short>(shorts: ReadonlyArray<S2>) =>
  <L extends Long, A extends Alias, S1 extends Short>(
    fa: Identifier<L, A, S1>
  ): Identifier<L, A, S1 | S2> =>
    pipe(fa.shorts, readonlyArray.concatW(shorts), (shorts) => ({
      ...fa,
      shorts,
    }))
