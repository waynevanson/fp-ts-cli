export const URI = "ReadonlyArrayReadonlyArray"

export type URI = typeof URI
export type ReadonlyArrayReadonlyArray<A> = ReadonlyArray<ReadonlyArray<A>>

declare module "fp-ts/HKT" {
  export interface URItoKind<A> {
    readonly [URI]: ReadonlyArrayReadonlyArray<A>
  }
}
