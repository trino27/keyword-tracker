# Frontend skills

What is true of THIS frontend (`fe/`, a React + Vite MVVM single-page app) and would be wrong to
hand to another app. Portable React rules live in
[`practices/fe/AGENTS.md`](../../practices/fe/AGENTS.md); when a rule there and a rule here
disagree, the workspace skill wins.

| skill | decides | read when |
| --- | --- | --- |
| [`folder-structure/`](folder-structure/SKILL.md) | where every file under `fe/src/` goes: the layer folders, the transport and base gateway, ViewModels and their services, screens, naming | before creating or moving any file |
| [`data-retrieval/`](data-retrieval/SKILL.md) | how a screen gets data: the ViewModel action, `status`, in-flight sharing, superseded answers, refresh after a write | before adding a screen that loads data, a filter, or a write that changes a list |
| [`error-display/`](error-display/SKILL.md) | where each failure is shown (page, section, field) and why a failed read and a refused write are two fields | before adding a screen, a form or a write action |
| [`testing/`](testing/SKILL.md) | this app's test setup: jsdom, the Toronto timezone, gateway-prototype spies, store reset, placement | before writing or placing a test |

For anything else, start at [`practices/fe/AGENTS.md`](../../practices/fe/AGENTS.md): layers,
ViewModels, gateways, routing and guards, forms, error handling and path aliases are written there
for this stack and not restated here.
