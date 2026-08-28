import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UsersNAppMapping,
  UserPermission,
} from '../../../../../libs/db/src';
import {
  PERMISSION_KEY,
  AppPermissionType,
} from '../decorators/require-permission.decorator';

@Injectable()
export class AppPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<AppPermissionType>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route doesn't require specific app permission, pass through
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication required');
    }

    // Extract target app_id from query (?id=33), params (:appId or :id), or body (app_id)
    const appId =
      request.query.id ||
      request.query.app_id ||
      request.params.appId ||
      request.params.id ||
      request.body?.app_id ||
      request.body?.id;

    if (!appId) {
      throw new BadRequestException(
        'App ID parameter (id/app_id) is required to evaluate data access permission',
      );
    }

    // 1. Check if user is mapped to this App
    const mapping = await this.mappingRepository.findOne({
      where: {
        user_id: user.id,
        app_id: appId,
        status: true,
      },
    });

    if (!mapping) {
      throw new ForbiddenException(
        `Access denied: Account is not authorized to access App ID '${appId}'`,
      );
    }

    // 2. Check granular UserPermission table
    const userPerms = await this.userPermissionRepository.find({
      where: {
        user_id: user.id,
        app_id: appId,
      },
      relations: ['permission'],
    });

    // If no granular permission rows are specified, default to mapping ownership access
    if (!userPerms || userPerms.length === 0) {
      return true;
    }

    const hasPermission = userPerms.some((up) => {
      if (!up.permission) return false;
      if (requiredPermission === 'read') {
        return up.permission.read || up.permission.write;
      }
      if (requiredPermission === 'write') {
        return up.permission.write;
      }
      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: You do not have '${requiredPermission}' permission for App ID '${appId}'`,
      );
    }

    return true;
  }
}
