# Crawl fixtures

`FixtureHttpTransport` (`be/src/infrastructure/remote-api/_testing/`) serves these files in
place of the network. `manifest.json` maps an exact URL to a status, headers and a file under
`sites/`; `patterns` answer unrecorded URLs with a synthesized article or a network failure.
A URL neither knows is a 404 — a test can never reach a live site.

- `sites/semrush/`, `sites/yoast/` — recorded from the live sites by
  `node be/test/fixtures/record-fixtures.ts`. The script header lists what it trims and why.
  Re-run it only to refresh them.
- `sites/synthetic/` — small hand-made sites, one per discovery edge case: no robots.txt, a
  gzipped sitemap (`sitemap.xml.gz` is a gzipped `urlset`), posts at the root with no feed, a
  blog found only through its feed, a pages-only site, a site with no sitemap. The
  `unreachable.example` pattern fails every request. The recorder keeps these entries.
