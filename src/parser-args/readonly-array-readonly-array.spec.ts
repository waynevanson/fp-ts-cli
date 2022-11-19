import fc from "fast-check";
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

      it.concurrent("should look up at the index lots", () => {
        const fromnonemptyarrays = <A>(arrays: Array<Array<A>>) =>
          fc.integer({ min: 0, max: arrays.length - 1 }).chain((outer) =>
            fc
              .integer({ min: 0, max: arrays[outer].length - 1 })
              .map((inner) => ({
                inner,
                outer,
                arrays,
                indexed: arrays[outer][inner],
              }))
          );

        const arrays = fc.array(fc.array(fc.string(), { minLength: 1 }), {
          minLength: 1,
        });

        const arbitrary = arrays.chain(fromnonemptyarrays);

        fc.assert(
          fc.property(arbitrary, ({ arrays, inner, outer, indexed }) => {
            const index = { outer, inner };
            const result = rara.Indexable.lookup(index)(arrays);
            expect(result).toStrictEqual(option.of(indexed));
          })
        );
      });
    });

    it.concurrent(
      "should look up and fail if any index is out of range",
      () => {
        const fromnonemptyarrays = <A>(arrays: Array<Array<A>>) =>
          fc.integer().chain((outer) =>
            fc
              .integer()
              .filter(
                (inner) =>
                  arrays[outer]?.length == null ||
                  inner < 0 ||
                  inner > arrays[outer].length
              )
              .map((inner) => ({ inner, outer, arrays }))
          );

        const arrays = fc.array(fc.array(fc.string()));

        const arbitrary = arrays.chain(fromnonemptyarrays);

        fc.assert(
          fc.property(arbitrary, ({ arrays, inner, outer }) => {
            const index = { outer, inner };
            const result = rara.Indexable.lookup(index)(arrays);
            expect(result).toStrictEqual(option.none);
          })
        );
      }
    );
  });

  describe("next", () => {
    it("should reset when going to next outer index", () => {
      const fromnonemptyarrays = <A>(arrays: Array<Array<A>>) =>
        fc
          .integer({ min: 0, max: arrays.length - 1 })
          .map((outer) => ({ outer, inner: arrays[outer].length, arrays }));

      const arrays = fc.array(fc.array(fc.string()), { minLength: 1 });

      const arbitrary = arrays.chain(fromnonemptyarrays);

      fc.assert(
        fc.property(arbitrary, ({ arrays, inner, outer }) => {
          const index = { outer, inner };
          const result = rara.Indexable.next(index)(arrays);
          expect(result).toStrictEqual({ outer: outer + 1, inner: 0 });
        })
      );
    });
  });
});
