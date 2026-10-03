---
name: caddy-config
description: Caddy as the single entry — serves the fe build, reverse-proxies /api to be; the directory-mount strategy and the Caddyfile template
---

# Caddy Configuration

Caddy is the **single entry** of the stack: it serves the static fe build and proxies `/api/*` to
the backend, so the browser sees one origin and no CORS configuration is needed. It lives in the
`web` compose service, configured by `caddy/Caddyfile`.

**Enforced by review.** Nothing checks that a proxy target matches where the proxy runs; a
target that is right for a container (`be:3000`) is wrong on a laptop (`localhost:3000`), and the
reverse is just as wrong.

## Mount strategy
Mount `./caddy` as a **directory** (for example to `/etc/caddy/conf:ro`) and point the run command
at the file inside it (`--config /etc/caddy/conf/Caddyfile`). A directory mount re-resolves the
file path on every `caddy reload`, so a `git pull` that replaces a Caddyfile inode is always
picked up. A single-file mount is pinned to the original inode and silently serves stale config.

## Template
```
{$SITE_ADDRESS:localhost} {
    encode zstd gzip

    handle /api/* {
        reverse_proxy be:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
        }
    }

    handle {
        root * /srv
        try_files {path} /index.html
        file_server
    }
}
```

The `handle` order is irrelevant to Caddy (blocks are sorted by matcher specificity), but keep
`/api/*` first so a reader sees the exception before the fallback. `try_files … /index.html` is
what lets the built SPA serve a deep link on reload: the router, not the server, resolves the path.

## Variables
- `{$SITE_ADDRESS}` — from the root `.env` through docker-compose `environment:`; the default
  after the colon keeps a bare `docker compose up` working.

## SSL
- For a real domain Caddy auto-obtains certificates and needs port 80 open (HTTP-01 challenge).
- For `localhost` Caddy uses its own local CA; there is nothing to configure.
