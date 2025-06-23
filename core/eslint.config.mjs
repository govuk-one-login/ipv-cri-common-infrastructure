import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    {
        ignores: [".aws-sam/build/*"],
    },
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        globals: {
          ...globals.node,
          ...globals.mocha,
          ...globals.browser,
          sinon: true,
          expect: true,
          setupDefaultMocks: true,
          axe: true
        }
      }
    },
    {
      rules: {
        "global-require": 0,
        "no-console": 2,
        "comma-dangle": 0,
          "padding-line-between-statements": [
          "error",
          {
            blankLine: "any",
            prev: "*",
            next: "*"
          }
        ],
          "@typescript-eslint/no-unused-vars": [
            "error",
            { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
          ],
      "@typescript-eslint/no-invalid-void-type" : 1
      }
    },










);
