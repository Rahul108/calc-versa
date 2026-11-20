import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserPermission,
  Permission,
  UsersNAppMapping,
  App,
  User,
} from '../db';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { AppAccessService } from '../auth/app-access.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly appAccess: AppAccessService,
  ) {}

  async getAppPermissions(appId: string): Promise<any[]> {
    const userPerms = await this.userPermissionRepository.find({
      where: { app_id: appId },
      relations: ['user', 'permission'],
    });

    const owners = await this.mappingRepository.find({
      where: { app_id: appId, is_owner: true },
    });
    const ownerIds = new Set(owners.map((m) => m.user_id));

    return userPerms.map((up) => ({
      user_id: up.user_id,
      is_owner: ownerIds.has(up.user_id),
      username: up.user?.username,
      email: up.user?.email,
      read: up.permission?.read ?? false,
      write: up.permission?.write ?? false,
      granted_at: up.created_at,
    }));
  }

  async updateUserPermission(
    appId: string,
    targetUserId: string,
    dto: UpdateUserPermissionDto,
  ): Promise<{ message: string }> {
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException(`User with ID "${targetUserId}" not found`);
    }
    const wantRead = dto.read ?? true;
    const wantWrite = dto.write ?? false;
    await this.appAccess.grant(appId, targetUserId, wantRead, wantWrite);

    return {
      message: `Permission updated successfully for user "${targetUser.username}" (read=${wantRead}, write=${wantWrite})`,
    };
  }

  async revokeUserPermission(appId: string, targetUserId: string): Promise<{ message: string }> {
    await this.appAccess.revoke(appId, targetUserId);

    return { message: `Access revoked for user "${targetUserId}" on app "${appId}"` };
  }

  async getMyPermissions(userId: string): Promise<any[]> {
    const userPerms = await this.userPermissionRepository.find({
      where: { user_id: userId },
      relations: ['app', 'permission'],
    });

    return userPerms.map((up) => ({
      app_id: up.app_id,
      app_name: up.app?.name,
      read: up.permission?.read ?? false,
      write: up.permission?.write ?? false,
    }));
  }
}
