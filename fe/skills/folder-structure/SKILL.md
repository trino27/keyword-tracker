---
name: folder-structure
description: Where every file under `fe/src/` goes and how it is named in the React + Vite MVVM SPA - App, Core, Gateways, Modules, ViewModels, the shared transport and base gateway, services, and naming rules. MANDATORY read before creating or moving any file under fe/src/.
---

# Frontend Folder Structure

Physical structure only: where files live and what they are called. Layering and import direction are `practices/fe/react/mvvm-layers/SKILL.md`; import spelling is `practices/fe/react/path-aliases/SKILL.md`.

## Tree (`fe/src/`)

```
fe/src/
├── main.tsx                         mounts the app: RouterProvider
├── index.scss                       global tokens and resets (Mantine supplies the rest)
├── App/
│   ├── Router/router.tsx            route tree: root -> pathless `app` layout route -> screens; type registration
│   └── Guards/                      beforeLoad guards, e.g. requireSession.ts (calls the session ViewModel)
├── Core/                            vocabulary, no feature knowledge
│   ├── Configs/apiConfig.ts
│   ├── Constants/
│   ├── Types/
│   └── Helpers/<Name>/<name>.ts     e.g. DescribeError/describeError.ts
├── Gateways/
│   ├── _Shared/
│   │   ├── Request/AppTransport.ts          appFetch(path, init): the ONLY fetch
│   │   ├── ABaseGateway/ABaseGateway.ts     abstract base: request(path, schema, init?)
│   │   └── Errors/ApiError/ApiError.ts      ApiError, toApiError, isUnauthorized
│   ├── <Entity>Gateway/
│   │   ├── <Entity>Gateway.ts
│   │   └── Validation/<Entity>Schemas.ts    zod schemas + T<Name> types
│   └── gateways.ts                  the registry: one instance of each gateway
├── ViewModels/
│   └── <Entity>ViewModel/
│       ├── <Entity>ViewModel.ts     use<Entity>ViewModel = create<I...>()(...)
│       └── Services/<Name>/<name>.ts        pure logic extracted from the store
└── Modules/
    ├── <Feature>/
    │   ├── <Feature>Screen.tsx      the screen
    │   ├── <Feature>Screen.module.scss
    │   └── <Piece>/<Piece>.tsx      components only this screen uses
    └── _Shared/<Name>/              shared UI, e.g. AppLayout/AppLayout.tsx
```

A collection screen that needs several stores keeps them in `ViewModels/<Entity>ViewModels/<Name>ViewModel/`.

## Where does it go

| Content | Location |
| --- | --- |
| A URL, a layout route, a search-param schema | `App/Router/router.tsx` |
| A guard that redirects | `App/Guards/` |
| A screen | `Modules/<Feature>/<Feature>Screen.tsx` |
| A component used by one screen | a subfolder of that feature |
| A component used by two or more features | `Modules/_Shared/<Name>/`, on its **second** consumer |
| State a screen reads, and the actions that load or change it | `ViewModels/<Entity>ViewModel/` |
| Logic extracted from a store (mapping, derivation, merging) | `ViewModels/<Entity>ViewModel/Services/<Name>/<name>.ts` |
| A request to the backend | a method on `Gateways/<Entity>Gateway/<Entity>Gateway.ts` |
| A response schema and its type | `Gateways/<Entity>Gateway/Validation/<Entity>Schemas.ts`; the type is `z.infer` of it |
| A new gateway | its folder, then one line in `Gateways/gateways.ts` |
| A form's zod schema | beside the form, `<Form>Schema.ts` |
| Pure helper used by one ViewModel | its `Services/` |
| Pure helper used by two or more ViewModels or by a view | `Core/Helpers/<Name>/` |
| Env-derived config, base URLs | `Core/Configs/` |
| A value or enum used by both `be` and `fe` | `packages/contracts` (`@app/contracts`), never declared twice |
| Styles | Mantine props first; anything else an SCSS module (`*.module.scss`) beside the component; global tokens in `index.scss`. No plain `.css` files |
| A test | beside the unit, `<name>.test.ts(x)` |

## Rules

- **Direction**: `App -> Modules -> ViewModels -> Gateways -> Core`. `Core/` and `Gateways/` import no feature layer (ESLint).
- **`fetch` appears only in `Gateways/_Shared/Request/AppTransport.ts`** (ESLint `no-restricted-globals`).
- **Gateway instances are imported only in `ViewModels/`** (ESLint `no-restricted-imports`; type imports are allowed everywhere).
- **A Service is scoped to its ViewModel folder.** Needed by a second one, it moves to `Core/Helpers/`.
- **`Core/` is vocabulary, not behaviour**: constants, types, pure helpers. Code that holds state, calls a gateway or knows a feature does not go there.
- **A leading underscore (`_Shared`) means "not a layer"**: a folder of shared things inside a layer.
- **No `index.ts` barrels** (ESLint `check-file/no-index`).
- **A unit that has a test lives in its own folder with it**; untested helpers may share a category folder.

## Naming

| Target | Casing | Example |
| --- | --- | --- |
| Layer folders | PascalCase | `ViewModels/`, `Gateways/` |
| Entity folders | `<Entity>ViewModel`, `<Entity>Gateway` | `PagesViewModel/`, `PageGateway/` |
| Component, screen, their folder and style | PascalCase | `PageTable/PageTable.tsx`, `PageTable.module.scss` |
| A folder wrapping one function | PascalCase folder, camelCase file | `DescribeError/describeError.ts` |
| Store hook | `use<Entity>ViewModel` | `usePagesViewModel` |
| Store interface | `I<Entity>ViewModel` | `IPagesViewModel` |
| Data types | `T<Name>`, derived from zod where a schema exists | `type TPage = z.infer<typeof pageSchema>` |
| Schemas | `<Entity>Schemas.ts`, constants camelCase | `pageSchema` |
| Abstract class | `A` prefix | `ABaseGateway` |
| Tests | the unit's name plus `.test` (and `.<concern>` when split) | `describeError.test.ts` |

## Enforced by

ESLint in `fe/eslint.config.js` for the rules marked above; everything else here by review.
