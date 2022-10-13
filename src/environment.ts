import { io } from "fp-ts"
import * as streams from "./streams"

export interface Program {
  readonly name: string
  readonly arguments: ReadonlyArray<string>
}

export interface Environment {
  readonly streams: streams.Streams
  readonly program: Program
}

export const node: io.IO<Environment> = () => ({
  streams: streams.node,
  program: {
    name: process.argv.slice(1, 2).at(0) as string,
    arguments: process.argv.slice(2),
  },
})
