import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { Permission, UsersNAppMapping, UserPermission } from '../db';
import { AppPermissionType } from './decorators/require-permission.decorator';

export interface AppAccess {
  read: boolean;
  write: boolean;
  owner: boolean;
}

/**
 * Single source of truth for "can user X do Y on app Z".
 *
 * Rules:
 * - No active UsersNAppMapping row => no access at all.
 * - The mapping flagged `is_owner` => read + write + owner (manage sharing, delete app).
 * - Otherwise access comes from UserPermission rows. A mapping with no permission
 *   rows grants read-only access (it used to grant write implicitly).
 */
@Injectable()
export class AppAccessService {
  constructor(
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Gives a (non-owner) user exactly the requested access to an app, atomically:
   * ensures an active mapping, replaces any existing permission rows with one row
   * for the matching Permission (created on first use). Refuses to touch the owner.
   */
  async grant(appId: string, userId: string, read: boolean, write: boolean): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      let mapping = await manager.findOne(UsersNAppMapping, {
        where: { app_id: appId, user_id: userId },
      });
      if (mapping?.is_owner) {
        throw new BadRequestException("The tool owner's access cannot be changed or revoked");
      }
      if (!mapping) {
        mapping = manager.create(UsersNAppMapping, { app_id: appId, user_id: userId, status: true });
      }
      mapping.status = true;
      await manager.save(mapping);

      let permission = await manager.findOne(Permission, { where: { read, write } });
      if (!permission) {
        permission = await manager.save(
          manager.create(Permission, { name: `perm_r${read ? 1 : 0}_w${write ? 1 : 0}`, read, write }),
        );
      }

      await manager.delete(UserPermission, { user_id: userId, app_id: appId });
      await manager.save(
        manager.create(UserPermission, { user_id: userId, app_id: appId, permission_id: permission.id }),
      );
    });
  }

  /** Removes a (non-owner) user's mapping and permission rows for an app, atomically. */
  async revoke(appId: string, userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const mapping = await manager.findOne(UsersNAppMapping, {
        where: { app_id: appId, user_id: userId },
      });
      if (mapping?.is_owner) {
        throw new BadRequestException("The tool owner's access cannot be changed or revoked");
      }
      await manager.delete(UserPermission, { user_id: userId, app_id: appId });
      if (mapping) await manager.remove(mapping);
    });
  }

  async getAccess(userId: string, appId: string): Promise<AppAccess | null> {
    if (!isUUID(appId)) {
      throw new BadRequestException(`Invalid app ID '${appId}'`);
    }

    const mapping = await this.mappingRepository.findOne({
      where: { user_id: userId, app_id: appId, status: true },
    });
    if (!mapping) return null;

    if (mapping.is_owner) {
      return { read: true, write: true, owner: true };
    }

    const userPerms = await this.userPermissionRepository.find({
      where: { user_id: userId, app_id: appId },
      relations: ['permission'],
    });

    if (userPerms.length === 0) {
      return { read: true, write: false, owner: false };
    }

    const write = userPerms.some((up) => up.permission?.write === true);
    const read = write || userPerms.some((up) => up.permission?.read === true);
    return { read, write, owner: false };
  }

  async assertAccess(
    userId: string,
    appId: string,
    required: AppPermissionType,
  ): Promise<AppAccess> {
    const access = await this.getAccess(userId, appId);
    if (!access) {
      throw new ForbiddenException(
        `Access denied: Account is not authorized to access App ID '${appId}'`,
      );
    }
    if (!access[required]) {
      throw new ForbiddenException(
        `Access denied: You do not have '${required}' permission for App ID '${appId}'`,
      );
    }
    return access;
  }
}
