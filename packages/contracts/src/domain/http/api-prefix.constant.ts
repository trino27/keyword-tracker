/**
 * The path segment every backend route sits under.
 *
 * The backend passes it to `setGlobalPrefix`, Caddy routes `/api/*` to the
 * backend by it, and the frontend builds its base URL from it.
 */
export const API_PREFIX = 'api';
