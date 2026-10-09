# Search updates module

Google's announced ranking updates, read from the Search Status Dashboard, so the position chart
can show when one ran — the first question to ask of a drop. Owns no table.

- **Source:** `https://status.search.google.com/incidents.json`, Google's own machine-readable
  list. Only the `Ranking` service is read: core, spam and other ranking updates. Crawling and
  serving incidents are outages, not updates, and say nothing about why a position moved.
- **Someone else's undocumented feed:** every field is checked and an entry missing one is
  dropped, not guessed (`parse-incidents.ts`).
- **Held in memory, never fatal.** The list is the same for every user and changes a few times a
  year, so the dashboard is asked at most every six hours, and after a failure not again for five
  minutes. A failed read serves the last good list; before there is one the answer says
  `available: false`, so an empty list is never mistaken for "no update happened".
- **Behind the session** like every route: it holds no user's data, but an anonymous endpoint
  that fetches from a third party on demand is an amplifier for anyone who finds it.
- **Outbound HTTP** goes through `RemoteApiCore` — the same SSRF checks, redirect policy and
  retries as the crawler. Tests serve `be/test/fixtures/sites/google-status/incidents.json`,
  recorded on 2026-10-09.
