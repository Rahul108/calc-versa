import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserPermission,
  Permission,
  UsersNAppMapping,
  App,
  User,
} from '../../../../libs/db/src';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAppPermissions(appId: string): Promise<any[]> {
    const userPerms = await this.userPermissionRepository.find({
      where: { app_id: appId },
      relations: ['user', 'permission'],
    });

    return userPerms.map((up) => ({
      user_id: up.user_id,
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

    let permission = await this.permissionRepository.findOne({
      where: { read: wantRead, write: wantWrite },
    });
    if (!permission) {
      permission = this.permissionRepository.create({
        name: `perm_r${wantRead ? 1 : 0}_w${wantWrite ? 1 : 0}`,
        read: wantRead,
        write: wantWrite,
      });
      permission = await this.permissionRepository.save(permission);
    }

    let userPerm = await this.userPermissionRepository.findOne({
      where: { user_id: targetUserId, app_id: appId },
    });
    if (userPerm) {
      userPerm.permission_id = permission.id;
    } else {
      userPerm = this.userPermissionRepository.create({
        user_id: targetUserId,
        app_id: appId,
        permission_id: permission.id,
      });
    }
    await this.userPermissionRepository.save(userPerm);

    // Ensure user mapping exists
    let mapping = await this.mappingRepository.findOne({
      where: { app_id: appId, user_id: targetUserId },
    });
    if (!mapping) {
      mapping = this.mappingRepository.create({
        app_id: appId,
        user_id: targetUserId,
        status: true,
      });
      await this.mappingRepository.save(mapping);
    }

    return {
      message: `Permission updated successfully for user "${targetUser.username}" (read=${wantRead}, write=${wantWrite})`,
    };
  }

  async revokeUserPermission(appId: string, targetUserId: string): Promise<{ message: string }> {
    const userPerm = await this.userPermissionRepository.findOne({
      where: { user_id: targetUserId, app_id: appId },
    });
    if (userPerm) {
      await this.userPermissionRepository.remove(userPerm);
    }

    const mapping = await this.mappingRepository.findOne({
      where: { app_id: appId, user_id: targetUserId },
    });
    if (mapping) {
      await this.mappingRepository.remove(mapping);
    }

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
