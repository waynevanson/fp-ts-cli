import { constVoid } from "fp-ts/lib/function";
import { fromStringDispatchToWritableStream, web } from "./streams";

describe("environment", () => {
  describe(fromStringDispatchToWritableStream, () => {
    it("should call the dispatcher when write is called", async () => {
      const stringDispatch = jest.fn();
      const writer = fromStringDispatchToWritableStream(stringDispatch);
      const data = "Hello, World!";
      await writer.write(data)();
      expect(stringDispatch).toHaveBeenCalledWith(data);
    });
  });

  describe("web", () => {
    it("should call console.log when stdout.write is called", async () => {
      const dispatch = jest.spyOn(console, "log").mockImplementation(constVoid);
      const data = "Hello, World!";
      await web.stdout.write(data)();
      expect(dispatch).toHaveBeenCalledWith(data);
    });

    it("should call console.error when stderr.write is called", async () => {
      const dispatch = jest
        .spyOn(console, "error")
        .mockImplementation(constVoid);
      const data = "Hello, World!";
      await web.stderr.write(data)();
      expect(dispatch).toHaveBeenCalledWith(data);
    });
  });
});
