import { argvNode } from "./side-effects"
import process from "process"

describe("argvNode", () => {
  it("should take the value from process.argv", () => {
    const argv_ = ["1", "2", "3"]
    process.argv = argv_
    const result = argvNode()
    expect(result).toStrictEqual(argv_)
  })
})
