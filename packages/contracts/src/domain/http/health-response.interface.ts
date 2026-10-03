/** `GET /api/health` — liveness plus whether the database answered. */
export interface IHealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}
