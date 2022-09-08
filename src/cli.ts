export const URI = "Cli";
export type URI = typeof URI;

export interface Env {
  readonly stdin: ReadableStream;
  readonly stdout: WritableStream;
  readonly stderr: WritableStream;
}

export type Buffer = ReadonlyArray<string>;

export interface Cli<I, O, A> {
  (i: I): (r: Env) => () => [A, O];
}

declare module "fp-ts/HKT" {
  export interface URItoKind3<R, E, A> {
    readonly [URI]: Cli<R, E, A>;
  }
}
