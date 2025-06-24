module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["tsconfig.eslint.json", "tsconfig.json"],
        sourceType: "module",
        ecmaVersion: 2022,
        ecmaFeatures: {
            impliedStrict: true,
        },
    },
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    globals: {
        sinon: true,
        expect: true,
    },
    plugins: ["@typescript-eslint"],
    extends: ["prettier", "eslint:recommended", "plugin:prettier/recommended", "plugin:@typescript-eslint/recommended"],
    ignorePatterns: ["node_modules", ".aws-sam", "build", "dist", "dotenv", "coverage", ".eslintrc.js", "jest.config.ts", "jest.setup.ts"],
    rules: {
        "no-console": 2,
        "padding-line-between-statements": ["error", { blankLine: "always", prev: "var", next: "return" }],
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
        "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true }],
    },
};
