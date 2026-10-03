import type { INestApplication } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { API_PREFIX } from '@app/contracts';
import { IS_PUBLIC_KEY } from '../../src/core/decorators/public/public.decorator';

export interface IRouteInfo {
  method: string;
  path: string;
  isPublic: boolean;
  /** `METHOD /api/path`, the key the route matrices use. */
  key: string;
}

const join = (...parts: string[]) =>
  '/' +
  parts
    .flatMap((part) => part.split('/'))
    .filter(Boolean)
    .join('/');

/**
 * Every HTTP route the application registers, read from Nest's own metadata — so a
 * controller added tomorrow is in the list without anyone remembering to add it.
 */
export function listRoutes(app: INestApplication): IRouteInfo[] {
  const routes: IRouteInfo[] = [];

  for (const moduleRef of app.get(ModulesContainer).values()) {
    for (const wrapper of moduleRef.controllers.values()) {
      const controller = wrapper.metatype;
      if (!controller) continue;

      const controllerPath = String(
        Reflect.getMetadata(PATH_METADATA, controller) ?? '',
      );
      const classIsPublic =
        Reflect.getMetadata(IS_PUBLIC_KEY, controller) === true;
      const prototype = controller.prototype as Record<string, unknown>;

      for (const name of Object.getOwnPropertyNames(prototype)) {
        const handler = prototype[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;

        const methodPath = Reflect.getMetadata(PATH_METADATA, handler) as
          string | undefined;
        if (methodPath === undefined) continue;

        const method =
          RequestMethod[
            Reflect.getMetadata(METHOD_METADATA, handler) as number
          ];
        const path = join(API_PREFIX, controllerPath, methodPath);
        const isPublic =
          classIsPublic || Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true;
        routes.push({ method, path, isPublic, key: `${method} ${path}` });
      }
    }
  }

  return routes.sort((a, b) => a.key.localeCompare(b.key));
}
