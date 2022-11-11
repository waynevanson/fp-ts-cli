import { Endomorphism } from "fp-ts/lib/Endomorphism"

export interface OuterInner {
  readonly outer: number
  readonly inner: number
}

export const incrementInner: Endomorphism<OuterInner> = ({ outer, inner }) => ({
  outer,
  inner: inner + 1,
})

export const incrementOuter: Endomorphism<OuterInner> = ({ outer, inner }) => ({
  outer: outer + 1,
  inner: inner,
})
