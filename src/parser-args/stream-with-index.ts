export interface StreamWithIndex<R, E> {
  readonly buffer: R;
  readonly cursor: E;
}

export const stream = <R, E>(buffer: R, cursor: E): StreamWithIndex<R, E> => ({
  buffer,
  cursor,
});
