// Forces the Node process timezone to UTC.
//
// MUST be the first import of every entry point, before anything constructs a
// `Date`. Node re-runs tzset() when `process.env.TZ` is assigned, so every later
// Date operation — and everything node-postgres sends and parses — is anchored to
// UTC whatever the host's zone. The container sets TZ=UTC as well; this is the
// runtime half of the same invariant. Converting to the viewer's zone is the
// frontend's job, at display time.
process.env.TZ = 'UTC';
