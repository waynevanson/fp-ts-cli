import { option } from "fp-ts";
import * as rara from "./readonly-array-readonly-array";

describe("ReadonlyArrayReadonlyArray", () => {
  describe("URI", () => {
    it.concurrent("should be ReadonlyArrayReadonlyArray", () => {
      const uri = "ReadonlyArrayReadonlyArray";
      expect(rara.URI).toBe(uri);
    });
  });

  describe("Indexable", () => {
    describe("lookup", () => {
      it.concurrent("should look up at the index", () => {
        const index = { outer: 1, inner: 1 };
        const data = [
          ["one", "two"],
          ["three", "four"],
        ];
        const result = rara.Indexable.lookup(index)(data);
        expect(result).toStrictEqual(option.of("four"));
      });
    });
  });
});
