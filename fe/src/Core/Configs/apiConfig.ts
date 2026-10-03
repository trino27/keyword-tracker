import { API_PREFIX } from "@app/contracts";

/**
 * Root-relative: the app and the API are one origin in every runtime — Caddy routes
 * `/api` in docker, Vite's proxy does in development — so the session cookie stays
 * first-party and nothing needs CORS.
 */
export const API_BASE_URL = `/${API_PREFIX}`;
