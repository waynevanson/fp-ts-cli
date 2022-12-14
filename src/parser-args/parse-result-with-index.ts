import { either } from "fp-ts";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { StreamWithIndex } from "./stream-with-index";

export interface ParseErrorWithIndex<R, E> {
  readonly expected: ReadonlyArray<string>;
  readonly fatal: boolean;
  readonly input: StreamWithIndex<R, E>;
}

export interface ParseSuccessWithIndex<R, E, A> {
  readonly next: StreamWithIndex<R, E>;
  readonly start: StreamWithIndex<R, E>;
  readonly value: A;
}

export type ParseResultWithIndex<R, E, A> = Either<
  ParseErrorWithIndex<R, E>,
  ParseSuccessWithIndex<R, E, A>
>;

export const success = <A, R, E>(
  value: A,
  next: StreamWithIndex<R, E>,
  start: StreamWithIndex<R, E>
): ParseResultWithIndex<R, E, A> => either.right({ next, start, value });

export const error = <R, E>(
  input: StreamWithIndex<R, E>,
  expected: ReadonlyArray<string> = [],
  fatal = false
): ParseResultWithIndex<R, E, never> => either.left({ input, expected, fatal });

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(fa: ParseResultWithIndex<R, E, A>): ParseResultWithIndex<R, E, B> =>
    pipe(
      fa,
      either.map((success) => ({ ...success, value: f(success.value) }))
    );
