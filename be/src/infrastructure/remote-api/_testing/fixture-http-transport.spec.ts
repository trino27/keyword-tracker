import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { RemoteApiTimeoutError } from '../remote-api.errors';
import {
  FIXTURES_ROOT,
  FixtureHttpTransport,
  loadFixtureManifest,
} from './fixture-http-transport';

const send = (transport: FixtureHttpTransport, url: string, maxBytes = 1e6) =>
  transport.send({
    url,
    headers: {},
    signal: AbortSignal.timeout(1_000),
    maxBytes,
  });

describe('FixtureHttpTransport', () => {
  const transport = () =>
    new FixtureHttpTransport({
      entries: {
        'https://site.example/robots.txt': {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: 'User-agent: *\nAllow: /',
        },
      },
      patterns: [
        {
          pattern: '^https://site\\.example/posts/[a-z-]+/$',
          synthesize: 'article',
        },
      ],
    });

  it('serves a recorded answer with lower-cased headers', async () => {
    const response = await send(transport(), 'https://site.example/robots.txt');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.body.toString()).toContain('User-agent');
  });

  it('an unknown URL is a 404, never the network', async () => {
    const response = await send(transport(), 'https://www.example.org/');

    expect(response.status).toBe(404);
  });

  // A crawl now asks every link in its posts for a status (plan D5). Recorded posts link
  // to hundreds of pages nobody recorded; as 404s they would all read as broken.
  it('an unrecorded URL asked for its status only answers 200', async () => {
    const response = await send(transport(), 'https://elsewhere.example/a/', 0);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(0);
  });

  it('an override still wins over the status-only rule', async () => {
    const fixture = transport();
    fixture.override('https://elsewhere.example/gone/', { status: 410 });

    expect(
      (await send(fixture, 'https://elsewhere.example/gone/', 0)).status,
    ).toBe(410);
  });

  it('synthesizes an article for a URL matching a pattern', async () => {
    const response = await send(
      transport(),
      'https://site.example/posts/link-building/',
    );

    expect(response.status).toBe(200);
    expect(response.body.toString()).toContain(
      '<h1>link building explained</h1>',
    );
  });

  it('logs every requested URL and honours overrides', async () => {
    const fixtures = transport();
    fixtures.override('https://site.example/robots.txt', { status: 503 });

    const response = await send(fixtures, 'https://site.example/robots.txt');

    expect(response.status).toBe(503);
    expect(fixtures.requests).toEqual(['https://site.example/robots.txt']);
  });

  it('fails like the network when the entry says so', async () => {
    const fixtures = transport();
    fixtures.override('https://site.example/', { status: 0, error: 'timeout' });

    await expect(
      send(fixtures, 'https://site.example/'),
    ).rejects.toBeInstanceOf(RemoteApiTimeoutError);
  });

  it('every file the committed manifest names exists', () => {
    const { entries } = loadFixtureManifest();
    const missing = Object.values(entries)
      .filter(({ file }) => file !== undefined)
      .filter(({ file }) => !existsSync(join(FIXTURES_ROOT, 'sites', file!)));

    expect(Object.keys(entries).length).toBeGreaterThan(100);
    expect(missing).toEqual([]);
  });
});
