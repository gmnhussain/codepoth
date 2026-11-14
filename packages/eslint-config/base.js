import js from "@eslint/js"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import eslintConfigPrettier from "eslint-config-prettier"
import { createNodeResolver, importX } from "eslint-plugin-import-x"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"

// File extensions and parser import-x needs to follow .ts/.tsx imports; its legacy
// `import-x/resolver` entry is dropped in favour of `import-x/resolver-next` below.
const { "import-x/resolver": _legacyResolver, ...importXTypeScriptSettings } =
  importX.flatConfigs.typescript.settings

/**
 * Shared ESLint configuration (docs/development/conventions.md §6).
 * Type-aware: each package sets `parserOptions.tsconfigRootDir` in its own
 * eslint.config.js so the TypeScript project service finds its tsconfig.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      "import-x": importX,
      turbo: turboPlugin,
    },
    settings: {
      ...importXTypeScriptSettings,
      // TypeScript resolver first so `@/*` and `@workspace/*` paths resolve.
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ alwaysTryTypes: true }),
        createNodeResolver(),
      ],
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      eqeqeq: ["error", "always"],
      "import-x/no-cycle": "error",
      "no-console": "error",
      "turbo/no-undeclared-env-vars": "error",
    },
  },
  {
    // Plain JS config files are not part of any tsconfig, so type-aware rules cannot run on them.
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ["dist/**"],
  },
  eslintConfigPrettier,
]
