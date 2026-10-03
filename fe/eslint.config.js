import js from "@eslint/js";
import checkFile from "eslint-plugin-check-file";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * The frontend's lint policy. The MVVM layer rules live here so they fire while the
 * import is being typed.
 *
 * `no-restricted-imports` options are REPLACED per file by flat config, not merged,
 * so the restrictions are declared once and composed into every block that needs them.
 */

/**
 * Gateways are reached only from ViewModels: a screen that calls a gateway itself
 * owns a second, differently-loaded copy of the same server state. Types stay
 * importable everywhere — a component may name `TClient` in its props.
 */
const GATEWAY_RESTRICTION = {
	group: ["@Gateways/*"],
	allowTypeImports: true,
	message:
		"Only a ViewModel calls a gateway. Select the data from the ViewModel instead (type imports are fine).",
};

/** Core and Gateways sit below the feature layers and may not reach up. */
const LAYER_DIRECTION_RESTRICTION = {
	// `regex` + `caseSensitive`: the glob matcher is case-insensitive, so `@App/*`
	// would also match the shared `@app/contracts` package.
	regex: "^@(Modules|App|ViewModels)/",
	caseSensitive: true,
	message:
		"Core/ and Gateways/ may not import a feature layer. Invert the dependency: the higher layer passes what it needs in.",
};

export default tseslint.config(
	{ ignores: ["dist/**", "coverage/**"] },
	eslintPluginPrettierRecommended,
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2022,
			globals: globals.browser,
			// Type-aware: guards, gateways and ViewModel actions are async code, which
			// the promise family of rules exists for.
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
			"jsx-a11y": jsxA11y,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			...jsxA11y.flatConfigs.recommended.rules,
			"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			// `==` silently equates 0, '' and null. `== null` stays allowed.
			eqeqeq: ["error", "always", { null: "ignore" }],
			"no-console": ["error", { allow: ["warn", "error"] }],
			// `fetch` belongs to the transport, which owns credentials and the base URL.
			"no-restricted-globals": [
				"error",
				{
					name: "fetch",
					message: "Go through a gateway (Gateways/_Shared/Request/AppTransport).",
				},
			],
			"no-restricted-imports": ["error", { patterns: [GATEWAY_RESTRICTION] }],
		},
	},
	{
		files: ["src/ViewModels/**/*.ts", "src/Gateways/**/*.ts"],
		rules: { "no-restricted-imports": "off" },
	},
	{
		files: ["src/Core/**/*.{ts,tsx}", "src/Gateways/**/*.ts"],
		rules: {
			"no-restricted-imports": ["error", { patterns: [LAYER_DIRECTION_RESTRICTION] }],
		},
	},
	{
		files: ["src/Gateways/_Shared/Request/AppTransport.ts"],
		rules: { "no-restricted-globals": "off" },
	},
	{
		// `throw redirect(...)` is TanStack Router's way out of a `beforeLoad`; it throws
		// a control-flow object, not an Error.
		files: ["src/App/**/*.{ts,tsx}"],
		rules: { "@typescript-eslint/only-throw-error": "off" },
	},
	{
		// No `index.ts` barrels: they hide the real dependency behind a re-export and make
		// the layer rules above unenforceable.
		files: ["src/**/index.{ts,tsx}"],
		plugins: { "check-file": checkFile },
		rules: { "check-file/no-index": "error" },
	},
	{
		// Test doubles legitimately produce `any`; everything else still applies.
		files: ["**/*.test.{ts,tsx}", "vitest.setup.ts"],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			"react-refresh/only-export-components": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/unbound-method": "off",
			"no-restricted-globals": "off",
			"no-restricted-imports": "off",
			"no-console": "off",
		},
	},
	{
		files: ["*.config.{ts,js}"],
		languageOptions: { globals: globals.node },
	},
);
