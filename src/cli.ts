import * as stateReaderParser from "./state-reader-parser";

export const URI = "Cli";
export type URI = typeof URI;

export interface Env {
  readonly stdin: ReadableStream;
  readonly stdout: WritableStream;
  readonly stderr: WritableStream;
}

export interface State {}

export interface Cli<A>
  extends stateReaderParser.StateReaderParser<Env, string, State, A> {}

declare module "fp-ts/HKT" {
  export interface URItoKind<A> {
    readonly [URI]: Cli<A>;
  }
}
