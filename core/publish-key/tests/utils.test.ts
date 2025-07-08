import { normaliseError } from "../src/utils";

describe("Error utility", () => {
    it.each([
        { prefix: undefined, errorMessage: "TEST", expectedErrorMessage: "Error: TEST" },
        { prefix: "", errorMessage: "TEST", expectedErrorMessage: "Error: TEST" },
        { prefix: "Wrapping message", errorMessage: "TEST", expectedErrorMessage: "Wrapping message: TEST" },
    ])("Wraps errors into a standard format", async ({ prefix, errorMessage, expectedErrorMessage }) => {
        let error = normaliseError(new Error(errorMessage), prefix);
        console.log(error);
        expect(error.message).toBe(expectedErrorMessage);
    });
    it.each([
        { prefix: undefined, errorObject: "TEST", expectedErrorMessage: `Error: "TEST"` },
        { prefix: undefined, errorObject: { message: "TEST" }, expectedErrorMessage: `Error: {"message":"TEST"}` },
        {
            prefix: undefined,
            errorObject: { message: "TEST", code: 200 },
            expectedErrorMessage: `Error: {"message":"TEST","code":200}`,
        },
    ])("Wraps thrown objects into errors", async ({ prefix, errorObject, expectedErrorMessage }) => {
        let error = normaliseError(errorObject, prefix);
        expect(error.message).toBe(expectedErrorMessage);
    });
});
