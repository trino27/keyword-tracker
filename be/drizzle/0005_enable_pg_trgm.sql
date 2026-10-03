-- Custom SQL migration file, put your code below! --
-- Drizzle cannot express an extension; the trigram indexes in the next migration need it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
