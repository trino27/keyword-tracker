import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';
import { createGuardedLookup } from '../guarded-lookup/guarded-lookup';
import {
  RemoteApiForbiddenAddressError,
  RemoteApiTooLargeError,
} from '../remote-api.errors';
import { UndiciHttpTransport } from './undici-http-transport';

/** Resolves any host to 127.0.0.1 without the public-address check — tests only. */
const loopbackLookup = createGuardedLookup(() =>
  Promise.resolve([{ address: '127.0.0.1', family: 4 }]),
);
const permissiveLookup: typeof loopbackLookup = (
  hostname,
  options,
  callback,
) =>
  options.all
    ? callback(null, [{ address: '127.0.0.1', family: 4 }])
    : callback(null, '127.0.0.1', 4);

describe('UndiciHttpTransport (local server)', () => {
  let server: Server;
  let base: string;
  /** Every transport a case builds, closed after it: an open agent keeps its sockets. */
  const opened: UndiciHttpTransport[] = [];
  const transport = (lookup: typeof loopbackLookup) => {
    const created = new UndiciHttpTransport(lookup);
    opened.push(created);
    return created;
  };

  beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url === '/big') {
        response.end(Buffer.alloc(64 * 1024, 'x'));
      } else if (request.url === '/gzip') {
        response
          .writeHead(200, { 'content-encoding': 'gzip' })
          .end(gzipSync('decoded body'));
      } else if (request.url === '/bomb') {
        response
          .writeHead(200, { 'content-encoding': 'gzip' })
          .end(gzipSync(Buffer.alloc(1024 * 1024, 'x')));
      } else if (request.url === '/endless') {
        // A body that never ends: a status check must not wait for it.
        response.writeHead(200, { 'content-type': 'text/html' });
        const timer = setInterval(() => response.write('x'.repeat(1024)), 5);
        response.on('close', () => clearInterval(timer));
      } else if (request.url === '/robots-headers') {
        response
          .writeHead(200, [
            ['X-Robots-Tag', 'bingbot: noindex'],
            ['X-Robots-Tag', 'noarchive'],
            ['Vary', 'Accept'],
            ['Vary', 'Cookie'],
          ])
          .end();
      } else if (request.url === '/moved') {
        response.writeHead(301, { location: '/target' }).end();
      } else {
        response
          .writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
          .end(
            `<html><head><title>${request.headers['user-agent']}</title></head></html>`,
          );
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    base = `http://local.test:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await Promise.all(opened.splice(0).map((created) => created.close()));
  });

  // Keep-alive sockets would hold close() open until they time out, and the Jest worker
  // with them — it was force-exited at the end of every run.
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const send = (
    transport: UndiciHttpTransport,
    path: string,
    maxBytes = 1024 * 1024,
  ) =>
    transport.send({
      url: `${base}${path}`,
      headers: { 'user-agent': 'TestBot/1.0' },
      signal: AbortSignal.timeout(5_000),
      maxBytes,
    });

  it('returns status, lower-cased headers, the body and the time to first byte', async () => {
    const response = await send(transport(permissiveLookup), '/page');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.body.toString()).toContain('<title>TestBot/1.0</title>');
    expect(response.ttfbMs).toBeGreaterThanOrEqual(0);
  });

  /** Each X-Robots-Tag header may name its own crawler; a comma would merge the scopes. */
  it('keeps repeated X-Robots-Tag headers apart, and joins the rest with commas', async () => {
    const response = await send(transport(permissiveLookup), '/robots-headers');

    expect(response.headers['x-robots-tag']).toBe(
      'bingbot: noindex\nnoarchive',
    );
    expect(response.headers.vary).toBe('Accept, Cookie');
  });

  it('stops reading past maxBytes', async () => {
    await expect(
      send(transport(permissiveLookup), '/big', 1024),
    ).rejects.toBeInstanceOf(RemoteApiTooLargeError);
  });

  // Link checks ask for the status alone (plan D5). Nine on one origin, past the agent's
  // eight connections: a body left open would hold its connection until the timeout.
  it('a zero-byte cap returns the head and frees the connection', async () => {
    const checker = transport(permissiveLookup);
    const answers = await Promise.all(
      Array.from({ length: 9 }, () =>
        checker.send({
          url: `${base}/endless`,
          headers: {},
          signal: AbortSignal.timeout(2_000),
          maxBytes: 0,
          overflow: 'truncate',
        }),
      ),
    );

    expect(answers.map(({ status, body }) => [status, body.length])).toEqual(
      Array.from({ length: 9 }, () => [200, 0]),
    );
  });

  it('decodes a gzip body', async () => {
    const response = await send(transport(permissiveLookup), '/gzip');

    expect(response.body.toString()).toBe('decoded body');
  });

  it('counts DECODED bytes against the cap — a small gzip bomb is refused', async () => {
    await expect(
      send(transport(permissiveLookup), '/bomb', 64 * 1024),
    ).rejects.toBeInstanceOf(RemoteApiTooLargeError);
  });

  it('does not follow a redirect — the caller checks every hop', async () => {
    const response = await send(transport(permissiveLookup), '/moved');

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe('/target');
  });

  it('with the production lookup, refuses a host that resolves to 127.0.0.1', async () => {
    await expect(
      send(transport(loopbackLookup), '/page'),
    ).rejects.toBeInstanceOf(RemoteApiForbiddenAddressError);
  });
});
