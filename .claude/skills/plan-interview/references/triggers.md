# Trigger evaluation — `plan-interview`

Twenty prompts that decide whether this skill fires. The half that must NOT fire is the load-
bearing half: a design interview on a one-line fix is the most annoying way an always-available
skill can be wrong, and it is the failure a description tuned only for recall produces.

The should-not-trigger cases are deliberately **near misses** — they name planning, design,
phases, edge cases or tests, and still do not warrant an interview. Obvious non-matches ("what
is the weather") measure nothing.

How to use it: run the prompts against a session that has the skill available, record whether it
fired, and fix the `description` — not this file — when a row comes out wrong. If a row is
genuinely ambiguous, the ambiguity belongs in the description as an explicit boundary.

## Must trigger

| # | prompt | why |
| --- | --- | --- |
| 1 | «давай обсудим как хранить историю позиций по дням» | explicit design conversation |
| 2 | «нужен план на переезд хранения снапшотов на партиции по месяцам» | asks for a plan |
| 3 | «спроектируем запуск краула при добавлении клиента» | new lifecycle + new invariant |
| 4 | «хочу добавить таблицу для SEO-проблем страницы, обсудим модель?» | new table, keyed by something undecided |
| 5 | «надо переделать статусы краула, но не знаю на что — помоги решить» | lifecycle change, shape undecided |
| 6 | «добавляем поле на wire между FE и BE, что учесть?» | contract crossing two workspaces |
| 7 | «как правильно сделать удаление клиента, чтобы не сломать историю?» | policy + cascade + invariant, several valid answers |
| 8 | «нужно вынести краулер в отдельный модуль, с чего начать» | ≥2 modules, ownership undecided |
| 9 | «сделай план реализации UI списка страниц по этим макетам, фазами» | plan requested, phases requested |
| 10 | «обсудим варианты: ESLint-правило или CHECK в схеме?» | a decision with trade-offs and no single right answer |

## Must NOT trigger

| # | prompt | why not — and what should happen instead |
| --- | --- | --- |
| 11 | «поправь опечатку в `CRAWL_MODULE.md`» | single-file edit; just do it |
| 12 | «быстрый фикс: `latestPosition` не приходит в списке страниц» | user said quick fix; skip orchestration entirely |
| 13 | «почему падает `crawl-run.service.spec.ts`?» | diagnosis, not design |
| 14 | «прогони линт и тесты и скажи что красное» | verification; `test-runner` |
| 15 | «объясни как работает подбор ключевых слов страницы» | explanation of existing behaviour; read the docs and answer |
| 16 | «допиши тест на краевой случай с двумя клиентами с одним URL» | one focused test; main session |
| 17 | «переименуй `siteUrl` в `websiteUrl` во всём фронте» | mechanical rename; shape already decided |
| 18 | «продолжай по плану из `design.md` изменения `add-rank-history`» | a plan already exists — execute it, do not re-interview |
| 19 | «сделай ревью моих изменений перед пушем» | review; `/code-review` or `qa` |
| 20 | «какой из двух вариантов имени ты бы выбрал для `PositionBadge` — 2 строки кода?» | a genuine choice, but the answer is one sentence; a nine-category coverage scan on it is theatre |

## The line these draw

Trigger when **the shape of the work is undecided and the decision has consequences that
outlive the conversation** — a column, a key, an invariant, a contract, a lifecycle.

Do not trigger when the shape is already decided (11, 17, 18), when the request is diagnosis or
verification (13, 14, 19), when the answer is an explanation (15), or when the whole decision is
smaller than the interview about it (16, 20).
