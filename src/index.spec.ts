import { run } from "./index"

describe("cli", () => {
  it("should parse the input?", () => {
    const data = ["runtime", "file"]
    const result = run(data)
    expect(result).toStrictEqual([])
  })
})
