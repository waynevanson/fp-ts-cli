import { toBuffer } from "../test-utils";
import * as parseResultWithIndex from "./parse-result-with-index";
import * as parserArgs from "./parser-args";
import * as streamWithIndex from "./stream-with-index";

describe("parser-args", () => {
  describe("outer", () => {
    it.concurrent.skip("should allow parsing up to a whole", () => {
      const outer = "flag-name";
      const input = [outer, "next-f"];
      const buffer = toBuffer(input);

      const start = streamWithIndex.stream(buffer, { outer: 0, inner: 0 });
      const next = streamWithIndex.stream(buffer, { outer: 0, inner: 11 });
      const expected = parseResultWithIndex.success(outer, next, start);

      const result = parserArgs.outer(start);
      expect(result).toStrictEqual(expected);
    });
  });
});
