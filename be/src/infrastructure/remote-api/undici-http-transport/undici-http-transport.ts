import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import type { Readable, Transform } from 'node:stream';
import { Agent, request } from 'undici';
import type { createGuardedLookup } from '../guarded-lookup/guarded-lookup';
import type {
  IHttpRequest,
  IHttpResponse,
  IHttpTransport,
} from '../http-transport/http-transport.interface';
import {
  RemoteApiError,
  RemoteApiTimeoutError,
  RemoteApiTooLargeError,
  RemoteApiUnavailableError,
} from '../remote-api.errors';

type TLookup = ReturnType<typeof createGuardedLookup>;

const DECOMPRESSORS: Record<string, () => Transform> = {
  gzip: createGunzip,
  'x-gzip': createGunzip,
  deflate: createInflate,
  br: createBrotliDecompress,
};

/**
 * The one place the crawler touches the network. Every socket resolves through the
 * guarded lookup, so a public hostname that answers with a private address is refused
 * at connect time, and the size cap counts DECODED bytes — a small gzip bomb cannot
 * grow past it.
 */
export class UndiciHttpTransport implements IHttpTransport {
  private readonly agent: Agent;

  constructor(lookup: TLookup) {
    this.agent = new Agent({
      connect: { lookup },
      keepAliveTimeout: 4_000,
      connections: 8,
    });
  }

  async send(input: IHttpRequest): Promise<IHttpResponse> {
    const startedAt = performance.now();
    try {
      const response = await request(input.url, {
        method: 'GET',
        headers: { 'accept-encoding': 'gzip, deflate, br', ...input.headers },
        signal: input.signal,
        dispatcher: this.agent,
      });
      const ttfbMs = Math.round(performance.now() - startedAt);
      const headers = normalizeHeaders(response.headers);
      const encoding = headers['content-encoding']?.trim().toLowerCase();
      const decompress = encoding ? DECOMPRESSORS[encoding] : undefined;
      const stream: Readable = decompress
        ? response.body.pipe(decompress())
        : response.body;
      const { body, truncated } = await readCapped(stream, input, () =>
        response.body.destroy(),
      );
      return {
        status: response.statusCode,
        headers,
        body,
        ttfbMs,
        ...(truncated ? { truncated } : {}),
      };
    } catch (error) {
      throw toRemoteApiError(error, input);
    }
  }

  async close(): Promise<void> {
    await this.agent.close();
  }
}

function normalizeHeaders(
  raw: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    headers[name.toLowerCase()] = Array.isArray(value)
      ? value.join(', ')
      : value;
  }
  return headers;
}

async function readCapped(
  stream: Readable,
  { url, maxBytes, overflow }: IHttpRequest,
  abort: () => void,
): Promise<{ body: Buffer; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of stream) {
    const buffer = chunk as Buffer;
    if (size + buffer.length > maxBytes) {
      abort();
      stream.destroy();
      if (overflow !== 'truncate')
        throw new RemoteApiTooLargeError(url, maxBytes);
      chunks.push(buffer.subarray(0, maxBytes - size));
      return { body: Buffer.concat(chunks), truncated: true };
    }
    size += buffer.length;
    chunks.push(buffer);
  }
  return { body: Buffer.concat(chunks), truncated: false };
}

function toRemoteApiError(error: unknown, input: IHttpRequest): RemoteApiError {
  if (error instanceof RemoteApiError) return error;
  const cause = (error as { cause?: unknown } | null)?.cause;
  if (cause instanceof RemoteApiError) return cause;
  if (input.signal.aborted) return new RemoteApiTimeoutError(input.url);
  return new RemoteApiUnavailableError(input.url, error);
}
