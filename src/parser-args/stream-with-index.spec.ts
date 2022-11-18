import * as streamWithIndex from "./stream-with-index";
import { StreamWithIndex } from "./stream-with-index";

describe("stream", () => {
  it("should construct a stream using the input parameters", () => {
    const buffer = "one";
    const cursor = 2;
    const result = streamWithIndex.stream(buffer, cursor);
    const expected: StreamWithIndex<string, number> = {
      buffer,
      cursor,
    };
    expect(result).toStrictEqual(expected);
  });
});
