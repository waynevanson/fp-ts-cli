import { Streams } from "./streams"

export interface Environment extends Streams {
  name: string
  arguments: ReadonlyArray<string>
}

// how to handle actions?

// pass in some stuff.
// promap (args -> either errors a) -> (environment -> io void)
export interface Cli<A> {}

// run,
