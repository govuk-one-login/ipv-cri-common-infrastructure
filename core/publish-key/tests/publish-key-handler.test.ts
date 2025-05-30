import { PublishKeyHandler } from "../src/publish-key-handler";
import { Context } from "aws-lambda";

describe("Publish-key-handler", () => {
  it("should print Hello, World!", async () => {
    const publishKeyHandler = new PublishKeyHandler();
    const result = await publishKeyHandler.handler({}, {functionName: 'testFunction', functionVersion: '1.2'} as Context);
    expect(result).toStrictEqual("Hello, World!");
  });
});