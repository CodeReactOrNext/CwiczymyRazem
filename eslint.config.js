const nextConfig = require("eslint-config-next/core-web-vitals");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const unusedImports = require("eslint-plugin-unused-imports");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const path = require("path");

module.exports = [
  ...nextConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: path.resolve(__dirname, "./tsconfig.json"),
      },
    },
    rules: {
      "import/no-extraneous-dependencies": "warn",
      "no-param-reassign": "error",
      "consistent-return": "warn",
      "no-empty-pattern": "warn",
      "no-use-before-define": "off",
      "@typescript-eslint/no-shadow": "warn",
      "@typescript-eslint/no-use-before-define": "error",
      "react/no-unstable-nested-components": "warn",
      "import/extensions": "off",
      "react/function-component-definition": "off",
      "react/destructuring-assignment": "off",
      "react/require-default-props": "off",
      "react/jsx-props-no-spreading": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        "ForInStatement",
        "LabeledStatement",
        "WithStatement"
      ],
      "import/prefer-default-export": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/order": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/naming-convention": "off",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
