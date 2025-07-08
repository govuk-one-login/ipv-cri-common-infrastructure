export function normaliseError(error: unknown, messagePrefix?: string): Error {
    return new Error(
        `${!messagePrefix?.length ? "Error" : messagePrefix}: ${
            error instanceof Error ? error.message : JSON.stringify(error)
        }`,
    );
}
