## ADDED Requirements

### Requirement: REMOTE-005 — a request made only for its status reads no body and frees its connection

A request whose caller needs only the status and the headers MUST stop reading at the response
head, MUST destroy the body stream, and MUST leave the connection free for the next request, so
that a server streaming an endless body cannot hold the pool. It MUST still be a GET; the
transport MUST NOT gain a method.

#### Scenario: an endless body
- **WHEN** nine status-only requests are made to one origin whose server streams a body forever,
  on a pool of 8 connections
- **THEN** all nine resolve with their status within the request timeout
