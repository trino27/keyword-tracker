-- Custom SQL migration file, put your code below! --

-- A CHECK may not contain a subquery, and "this array has no duplicates" needs unnest,
-- which is one. The predicate therefore lives in an IMMUTABLE function that the next
-- migration's constraints call. Note the limit: a CHECK calling a user-defined function
-- is validated on write, and changing the function later does NOT re-validate rows
-- already stored.
CREATE OR REPLACE FUNCTION array_is_clean(codes varchar[]) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT codes IS NULL
      OR (array_position(codes, NULL) IS NULL
          AND NOT ('' = ANY(codes))
          AND cardinality(codes) = (SELECT count(DISTINCT c) FROM unnest(codes) c));
$$;
