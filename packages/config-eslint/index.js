import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** Build directories that never need linting. */
export const ignores = [
  '**/dist/**',
  '**/coverage/**',
  '**/node_modules/**',
  '**/playwright-report/**',
  '**/test-results/**',
  'apps/crm-agent/src/routeTree.gen.ts',
  'apps/crm-agent/public/mockServiceWorker.js',
  'packages/api-client/src/generated/**',
]

/**
 * Flat ESLint config shared by every workspace package.
 *
 * The rules are intentionally non-type-aware: type correctness is enforced by
 * `pnpm typecheck`, while ESLint focuses on correctness, hooks, a11y and imports.
 */
export default tseslint.config(
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      // TypeScript already resolves imports; the resolver would need a project
      // graph and slows linting down without adding signal.
      'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    },
    rules: {
      // Resolusi nama/ekspor adalah tugas TypeScript; plugin import kerap salah
      // membaca conditional exports paket ESM seperti @tanstack/react-query.
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: [
      '**/*.config.{js,ts,mjs}',
      '**/scripts/**',
      '**/*.test.{ts,tsx}',
      '**/mocks/**',
      '**/perf/**',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
)
