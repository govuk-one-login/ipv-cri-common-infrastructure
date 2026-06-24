import { defineConfig, globalIgnores } from "eslint/config";
import eslintJs from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import eslintConfigPrettierFlat from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig(
    eslintJs.configs.recommended,
    typescriptEslint.configs.recommended,
    eslintConfigPrettierFlat,
    globalIgnores(["**/build/**", "**/node_modules/**"]),
    {
        languageOptions: {
            globals: globals.node,
        },
    },
);
