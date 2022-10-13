import { functor, readonlyTuple } from "fp-ts"
import { Functor3 } from "fp-ts/lib/Functor"
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

export const map = functor.map(parser.Functor, readonlyTuple.Functor)
export const Functor: Functor3<URI> = { URI, map: (fa, f) => map(f)(fa) }
