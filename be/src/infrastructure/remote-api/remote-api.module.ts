import { Module } from '@nestjs/common';
import { createGuardedLookup } from './guarded-lookup/guarded-lookup';
import { HTTP_TRANSPORT } from './http-transport/http-transport.interface';
import { RemoteApiCore } from './remote-api.core';
import { UndiciHttpTransport } from './undici-http-transport/undici-http-transport';

/**
 * Outbound HTTP. Tests swap `HTTP_TRANSPORT` for the fixture transport with
 * `overrideProvider`; nothing else in the app can open a socket to a site.
 */
@Module({
  providers: [
    {
      provide: HTTP_TRANSPORT,
      useFactory: () => new UndiciHttpTransport(createGuardedLookup()),
    },
    RemoteApiCore,
  ],
  exports: [HTTP_TRANSPORT, RemoteApiCore],
})
export class RemoteApiModule {}
