// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Lint policy for `@app/contracts` — the package both `be` and `fe` import.
 *
 * Deliberately NOT type-aware: the package holds enums, wire shapes and pure
 * functions with no async code, so the promise family that makes type-aware
 * linting pay for itself has nothing to bite on.
 */
export default tseslint.config(
  { ignores: ['dist', 'dist-cjs', 'node_modules'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // A shared library cannot know whether it runs in a browser or under pino.
      // Anything worth reporting is a thrown error or a returned result.
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // The package is the FLOOR of the dependency graph: be and fe import
              // it, it imports neither. A relative escape into a workspace compiles
              // and creates a cycle that first shows up as a broken Docker build.
              regex: '(^|/)(be|fe)/',
              caseSensitive: true,
              message:
                'A shared package must not import from an application workspace. Move the shared value INTO this package instead.',
            },
            {
              regex:
                '^@(Core|Modules|App|ViewModels|Gateways|Scenarios|core|modules|shared|infrastructure|persistence)/',
              caseSensitive: true,
              message:
                'That is an fe/be path alias. A shared package cannot depend on either application.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
);
