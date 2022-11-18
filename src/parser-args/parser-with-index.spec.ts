import * as parserWithIndex from "./parser-with-index";
import * as streamWithIndex from "./stream-with-index";
import * as parseResultWithIndex from "./parse-result-with-index";

describe("parserWithIndex", () => {
  describe("of", () => {
    it.concurrent("should put the value inside the parser value", () => {
      const value = "a";
      const buffer = ["one", "two"];
      const start = streamWithIndex.stream(buffer, "three");
      const result = parserWithIndex.of(value)(start);
      const expected = parseResultWithIndex.success(value, start, start);

      expect(result).toStrictEqual(expected);
    });
  });
});
