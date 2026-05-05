import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        env: {
            DECRYPTION_KEY_ID: "SOME_KEY_VALUE",
            JWKS_BUCKET_NAME: "SOME_BUCKET_VALUE",
        },
        coverage: {
            thresholds: {
                statements: 96,
                branches: 85,
                functions: 100,
                lines: 96,
            },
        },
    },
});
