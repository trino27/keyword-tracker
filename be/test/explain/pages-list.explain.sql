-- The pages list's keyword statement on seeded data — the one that touches
-- rank_snapshots. Expect, under the LATERAL Limit: an Index Scan Backward on
-- rank_snapshots_pk with loops = the slice's pair count, and no Seq Scan on it.
--
--   docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql

\set user_email '''yoast.manager@example.com'''

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH slice AS (
  SELECT p.id
  FROM pages p
  JOIN clients c ON c.id = p.client_id
  JOIN users u ON u.id = c.user_id AND u.email = :user_email
  ORDER BY c.name, c.id, p.sitemap_position, p.id
  LIMIT 20
)
SELECT pk.page_id, k.id AS keyword_id, k.term, pk.relevance,
       latest.position, latest.captured_at
FROM pages p
JOIN slice ON slice.id = p.id
JOIN page_keywords pk ON pk.page_id = p.id AND pk.last_seen_run_id = p.last_seen_run_id
JOIN keywords k ON k.id = pk.keyword_id
LEFT JOIN LATERAL (
  SELECT s.position, s.captured_at
  FROM rank_snapshots s
  WHERE s.page_id = pk.page_id AND s.keyword_id = pk.keyword_id
  ORDER BY s.captured_at DESC
  LIMIT 1
) latest ON true
ORDER BY pk.page_id, pk.relevance DESC, k.term;

-- The slice with its PageSpeed summary: page_speed is joined by primary key, one probe
-- per listed page. Expect an Index Scan using page_speed_pkey (or a hash on the small
-- table), never a Seq Scan feeding a sort.
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT p.id, ps.status, ps.lcp_ms, ps.inp_ms, ps.cls, ps.measured_at
FROM pages p
JOIN clients c ON c.id = p.client_id
JOIN users u ON u.id = c.user_id AND u.email = :user_email
LEFT JOIN page_speed ps ON ps.page_id = p.id
ORDER BY c.name, c.id, p.sitemap_position, p.id
LIMIT 20;
