import { parseResult, stream, string } from "parser-ts";
import * as parserArgs from "./parser-args";

describe("parser-args", () => {
  describe(parserArgs.fromParserString, () => {
    it("should consume a string parser by passing in an argument", () => {
      const text = "hello";
      const fa = string.string(text);
      const result = parserArgs.fromParserString(fa);
      const buffer = [text.split("")];
      const start = stream.stream(buffer, 0);
      const next = stream.stream(buffer, buffer.length);
      const actual = result(start);
      const expected = parseResult.success(text, next, start);
      expect(actual).toStrictEqual(expected);
    });

    it("should fail when the string parser fails", () => {
      const text = "hello";
      const badness = "world";
      const fa = string.string(badness);
      const result = parserArgs.fromParserString(fa);
      const buffer = [text.split("")];
      const start = stream.stream(buffer, 0);
      const actual = result(start);
      const expected = parseResult.error(start, [`"${badness}"`]);
      expect(actual).toStrictEqual(expected);
    });

    it("should fail when the parser has nothing left to consumer", () => {
      const text = "hello";
      const fa = string.string(text);
      const result = parserArgs.fromParserString(fa);
      const buffer: Array<ReadonlyArray<string>> = [];
      const start = stream.stream(buffer, 0);
      const actual = result(start);
      const expected = parseResult.error(start, ['"parser-string"']);
      expect(actual).toStrictEqual(expected);
    });
  });
});
