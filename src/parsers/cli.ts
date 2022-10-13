import { parserReadonlyTuple } from "../fp"

export type Buffer = ReadonlyArray<string>

export interface CLI<E, A>
  extends parserReadonlyTuple.ParserReadonlyTuple<Buffer, E, A> {}

export const URI = "CLI"
export type URI = typeof URI

declare module "fp-ts/HKT" {
  export interface URItoKind2<E, A> {
    readonly [URI]: CLI<E, A>
  }
}

export const map: <A, B>(f: (a: A) => B) => <E>(fa: CLI<E, A>) => CLI<E, B> =
  parserReadonlyTuple.map
