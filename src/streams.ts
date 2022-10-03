import { taskEither } from "fp-ts";

export interface WritableStream<A> {
  write(chunk: A): taskEither.TaskEither<string, void>;
}

export interface Streams {
  stdout: WritableStream<string>;
  stderr: WritableStream<string>;
}

export function fromWriteStreamToWritableStream(
  stream: NodeJS.WriteStream
): WritableStream<string> {
  return {
    write: taskEither.tryCatchK(
      (chunk) =>
        new Promise((resolve, reject) =>
          stream.write(chunk, (error) =>
            error == null ? resolve() : reject(error.message)
          )
        ),
      (reason) => reason as string
    ),
  };
}

export function fromStringDispatchToWritableStream(
  stringDispatch: (string: string) => void
): WritableStream<string> {
  return {
    write: (string) => taskEither.fromIO(() => stringDispatch(string)),
  };
}

export const node: Streams = {
  stderr: fromWriteStreamToWritableStream(process.stderr),
  stdout: fromWriteStreamToWritableStream(process.stdout),
};

export const web: Streams = {
  stderr: fromStringDispatchToWritableStream((a) => console.error(a)),
  stdout: fromStringDispatchToWritableStream((a) => console.log(a)),
};
