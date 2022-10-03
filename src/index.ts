import { task } from "fp-ts"
import { Streams } from "./streams"

export interface Environment extends Streams {
  name: string
  arguments: ReadonlyArray<string>
}

// how to handle actions?
// don't enclose it, that's someone elses job
// multiple commands as a sum type? { [action: string]: flags } unlikely.

// pass in some stuff.
// promap (args -> either errors a) -> (environment -> io void)
export interface Cli<A> {}
