-- The position history statement on seeded data: a page's current pairs, each joined
-- to its snapshots in a 30-day UTC range. Expect an index range scan on
-- rank_snapshots_pk per pair (page_id, keyword_id, captured_at bounds), no Seq Scan.
--
--   docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/position-history.explain.sql

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH one_page AS (
  SELECT p.id, c.user_id
  FROM pages p
  JOIN clients c ON c.id = p.client_id
  ORDER BY p.id
  LIMIT 1
)
SELECT pk.keyword_id, k.term, s.captured_at, s.position
FROM pages p
JOIN one_page op ON op.id = p.id
JOIN clients c ON c.id = p.client_id AND c.user_id = op.user_id
JOIN page_keywords pk ON pk.page_id = p.id AND pk.last_seen_run_id = p.last_seen_run_id
JOIN keywords k ON k.id = pk.keyword_id
LEFT JOIN rank_snapshots s
  ON s.page_id = pk.page_id
 AND s.keyword_id = pk.keyword_id
 AND s.captured_at >= now() - interval '30 days'
 AND s.captured_at < now()
ORDER BY pk.relevance DESC, k.term, s.captured_at;
