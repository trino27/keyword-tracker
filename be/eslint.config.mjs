// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The backend's lint policy. Architectural rules live here rather than in a
 * reviewer's checklist so they fire in the editor, on `pnpm lint`, on push and
 * in CI — the moment the import is typed, which is the only moment the fix is free.
 *
 * Flat config REPLACES (does not merge) a rule's options per file. Every block
 * below that sets `@typescript-eslint/no-restricted-imports` or
 * `no-restricted-syntax` therefore re-composes the shared constants instead of
 * redeclaring a subset — otherwise a later block silently drops a ban.
 */

const LOGGER_RESTRICTION = {
  name: '@nestjs/common',
  importNames: ['Logger'],
  message:
    "Use @InjectPinoLogger from 'nestjs-pino' in DI contexts, or " +
    "bootstrapLogger.child(...) from '@infrastructure/observability/logger/logger.bootstrap' " +
    'in factory providers, bootstrap and scripts.',
};

const DB_ACCESS_PATTERNS = [
  {
    group: ['drizzle-orm', 'drizzle-orm/*'],
    allowTypeImports: false,
    message:
      'Drizzle is repository-only. Depend on a repository (or a domain service), not the ORM.',
  },
  {
    group: ['@persistence/schema', '@persistence/schema/*'],
    allowTypeImports: false,
    message:
      'DB row types (*DbModel / *InsertModel) and table schemas are repository-only. ' +
      'Accept and return domain interfaces (I*) instead.',
  },
];

/**
 * An IUserScope is proof the session guard authenticated the request (I3). Asserting
 * one into existence anywhere else would let a request parameter pose as a user.
 */
const SCOPE_FORGERY_SELECTOR = {
  selector: "TSAsExpression[typeAnnotation.typeName.name='IUserScope']",
  message:
    'Only the session guard creates an IUserScope (create-user-scope.ts). Take it from @CurrentScope().',
};

/** Unscoped `...ForWorker` methods read any user's data; controllers never call them (I4). */
const WORKER_CALL_SELECTOR = {
  selector: 'CallExpression[callee.property.name=/ForWorker$/]',
  message:
    'A controller serves one user: call a scoped method, never a ...ForWorker one.',
};

const BARE_ERROR_SELECTOR = {
  selector: "NewExpression[callee.name='Error']",
  message:
    'Throw InvariantViolationException (or a BusinessException subclass from ' +
    'createException), never a bare Error, from a service or repository.',
};

/** Drizzle schema conventions — caught while the column is typed, not after it ships. */
const SCHEMA_SELECTORS = [
  {
    selector:
      "CallExpression[callee.name='pgTable'] > ArrowFunctionExpression[body.type='ObjectExpression']",
    message:
      'Drizzle table options must return an ARRAY: `(t) => [index(...), uniqueIndex(...)]`.',
  },
  {
    // A bare `timestamp` stores wall-clock with no offset, so the same instant reads
    // differently per server timezone; converting later rewrites the whole table.
    selector:
      "CallExpression[callee.name='timestamp']:not(:has(Property[key.name='withTimezone']))",
    message:
      'Timestamp columns must be timestamptz: pass `{ withTimezone: true }`, or use the ' +
      'factories in persistence/schema/_shared/columns.',
  },
  {
    selector:
      "CallExpression[callee.name='jsonb'] > Literal:not([value=/_json$/])",
    message: 'A jsonb column name must end with `_json`.',
  },
  {
    selector:
      "CallExpression[callee.name='pgEnum'] > Literal:not([value=/_enum$/])",
    message: 'A Postgres enum type name must end with `_enum`.',
  },
];

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'drizzle/**', 'eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Every promise is awaited, caught, or explicitly `void`-ed.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      // `==` silently equates 0, '' and null. `== null` stays allowed.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // `console` bypasses pino: no request correlation, no level filtering.
      'no-console': 'error',
      // A new enum member must not fall through an existing switch. Prefer a
      // `Record<TEnum, T>` map or a strategy (practices/be/polymorphism-over-switch).
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: [LOGGER_RESTRICTION] },
      ],
    },
  },
  {
    // Layer direction: core / shared / infrastructure never import a feature module.
    files: [
      'src/core/**/*.ts',
      'src/shared/**/*.ts',
      'src/infrastructure/**/*.ts',
    ],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [LOGGER_RESTRICTION],
          patterns: [
            {
              group: ['@modules/*', '@modules/**'],
              message:
                'Lower layers (core/shared/infrastructure) must not import a feature module. ' +
                'Move the shared code down into @core/@shared, or keep it inside the module.',
            },
          ],
        },
      ],
    },
  },
  {
    // DB-access boundary: only repositories and domain services speak Drizzle and row types.
    files: ['src/modules/**/*.ts'],
    ignores: [
      'src/modules/**/repositories/**',
      'src/modules/**/services/domain/**',
      'src/modules/**/*.spec.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { paths: [LOGGER_RESTRICTION], patterns: DB_ACCESS_PATTERNS },
      ],
    },
  },
  {
    // I3 everywhere in the application. Every block below that sets
    // no-restricted-syntax re-composes this selector: flat config replaces the rule's
    // options per file rather than merging them.
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', SCOPE_FORGERY_SELECTOR],
    },
  },
  {
    files: ['src/persistence/schema/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        SCOPE_FORGERY_SELECTOR,
        ...SCHEMA_SELECTORS,
      ],
    },
  },
  {
    // A bare Error becomes a 500 with no code, so the caller cannot tell an
    // invariant break from a network fault. Services and repositories throw
    // InvariantViolationException or a BusinessException subclass; bare Error is
    // reserved for bootstrap and load-time assertions.
    files: ['src/**/services/**/*.ts', 'src/**/repositories/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        SCOPE_FORGERY_SELECTOR,
        BARE_ERROR_SELECTOR,
      ],
    },
  },
  {
    files: ['src/modules/**/controllers/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        SCOPE_FORGERY_SELECTOR,
        WORKER_CALL_SELECTOR,
      ],
    },
  },
  {
    // The one file allowed to create a scope.
    files: ['src/modules/auth/guards/session/create-user-scope.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // Tests lean on jest doubles that legitimately produce `any`. Everything else —
    // dead code, prettier, the architectural bans — still applies.
    files: [
      '**/*.spec.ts',
      '**/*-spec.ts',
      '**/*.spec-helpers.ts',
      'test/**/*.ts',
    ],
    plugins: { jest },
    // Tests build scopes and call worker methods on purpose.
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-console': 'off',
      'no-restricted-syntax': 'off',
      // A committed `.only` shrinks the suite to one case while the run stays green.
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'error',
      'jest/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectPgError', 'done'] },
      ],
      'jest/no-identical-title': 'error',
    },
  },
  {
    // One-shot CLIs run outside the Nest container; stdout is their whole contract.
    files: ['src/migrate.ts', 'src/seed/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
