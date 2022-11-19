import * as rara from "./readonly-array-readonly-array";

describe("URI", () => {
  it.concurrent("should be ReadonlyArrayReadonlyArray", () => {
    const uri = "ReadonlyArrayReadonlyArray";
    expect(rara.URI).toBe(uri);
  });
});
