import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_KEY,
  AppPermissionType,
} from '../decorators/require-permission.decorator';
import { AppAccessService } from '../app-access.service';
import type { Request } from 'express';

/**
 * Resolves the target app ID for a request.
 *
 * If the route declares an app ID path parameter (`:id` / `:appId`), that value is
 * authoritative — it is exactly what the controller acts on, so query/body values are
 * ignored. Routes without one (e.g. `POST /records`, `GET /records`) take `app_id` from
 * the body or query; if both are present they must agree.
 */
export function resolveAppId(
  request: Pick<Request, 'params' | 'body' | 'query'>,
): string | undefined {
  const params = request.params ?? {};
  const fromParams = params.appId ?? params.id;
  if (fromParams !== undefined) return String(fromParams);

  const fromBody = request.body?.app_id;
  const fromQuery = request.query?.app_id;
  if (fromBody !== undefined && fromQuery !== undefined && String(fromBody) !== String(fromQuery)) {
    throw new BadRequestException('Conflicting app_id values in request body and query');
  }
  const appId = fromBody ?? fromQuery;
  return appId === undefined ? undefined : String(appId);
}

@Injectable()
export class AppPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly appAccessService: AppAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<AppPermissionType>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required');
    }

    const appId = resolveAppId(request);
    if (!appId) {
      throw new BadRequestException(
        'App ID (route :id or app_id) is required to evaluate data access permission',
      );
    }

    request.appAccess = await this.appAccessService.assertAccess(
      user.id,
      appId,
      requiredPermission,
    );
    return true;
  }
}
