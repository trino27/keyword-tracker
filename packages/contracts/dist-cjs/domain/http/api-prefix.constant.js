"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_PREFIX = void 0;
/**
 * The path segment every backend route sits under.
 *
 * The backend passes it to `setGlobalPrefix`, Caddy routes `/api/*` to the
 * backend by it, and the frontend builds its base URL from it.
 */
exports.API_PREFIX = 'api';
