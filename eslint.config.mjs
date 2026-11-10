import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'previews/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/verify.mjs'], languageOptions: { globals: globals.browser } },
  { files: ['src/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.mjs', 'vite.config.ts', 'api/**/*.ts', 'server/**/*.ts'], languageOptions: { globals: globals.node } },
);
