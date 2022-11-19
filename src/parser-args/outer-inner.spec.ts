import * as oi from "./outer-inner";

describe("empty", () => {
  it.concurrent("should have both values at zero", () => {
    expect(oi.empty).toStrictEqual({ outer: 0, inner: 0 });
  });
});

describe("incrementOuter", () => {
  it.concurrent(
    "should increment the outer value by one and reset the inner value",
    () => {
      const outer = 9;
      const data: oi.OuterInner = { outer, inner: 12 };
      const result = oi.incrementOuter(data);

      expect(result).toStrictEqual({ outer: outer + 1, inner: 0 });
    }
  );
});

describe("incrementInner", () => {
  it.concurrent("only increment the inner value by one", () => {
    const data: oi.OuterInner = { outer: 12, inner: 9 };
    const result = oi.incrementInner(data);
    const expected: oi.OuterInner = { outer: 12, inner: 10 };
    expect(result).toStrictEqual(expected);
  });
});
