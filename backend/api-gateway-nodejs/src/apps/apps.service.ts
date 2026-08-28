import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  App,
  UsersNAppMapping,
  UserPermission,
  Permission,
  User,
  AppRecord,
} from '../../../../libs/db/src';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ShareAppDto } from './dto/share-app.dto';
import { CalculateAppDto } from './dto/calculate-app.dto';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppRecord)
    private readonly recordRepository: Repository<AppRecord>,
  ) {}

  async create(userId: string, dto: CreateAppDto): Promise<App> {
    const existing = await this.appRepository.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Calculator tool with name "${dto.name}" already exists`);
    }

    const app = this.appRepository.create({
      name: dto.name,
      description: dto.description,
      inputsConfig: dto.inputsConfig || null,
      formulaConfig: dto.formulaConfig || null,
      uiConfig: dto.uiConfig || null,
      status: true,
    });
    const savedApp = await this.appRepository.save(app);

    const mapping = this.mappingRepository.create({
      app_id: savedApp.id,
      user_id: userId,
      status: true,
    });
    await this.mappingRepository.save(mapping);

    let fullPermission = await this.permissionRepository.findOne({
      where: { read: true, write: true },
    });
    if (!fullPermission) {
      fullPermission = this.permissionRepository.create({
        name: 'owner_full_access',
        read: true,
        write: true,
      });
      fullPermission = await this.permissionRepository.save(fullPermission);
    }

    const userPermission = this.userPermissionRepository.create({
      user_id: userId,
      app_id: savedApp.id,
      permission_id: fullPermission.id,
    });
    await this.userPermissionRepository.save(userPermission);

    return savedApp;
  }

  async findAllForUser(userId: string): Promise<App[]> {
    const mappings = await this.mappingRepository.find({
      where: { user_id: userId, status: true },
      relations: ['app'],
    });
    return mappings.map((m) => m.app).filter((app) => app && app.status);
  }

  async findOne(appId: string): Promise<App> {
    const app = await this.appRepository.findOne({ where: { id: appId, status: true } });
    if (!app) {
      throw new NotFoundException(`Calculator tool with ID "${appId}" not found`);
    }
    return app;
  }

  async update(appId: string, dto: UpdateAppDto): Promise<App> {
    const app = await this.findOne(appId);
    if (dto.name !== undefined) app.name = dto.name;
    if (dto.description !== undefined) app.description = dto.description;
    if (dto.inputsConfig !== undefined) app.inputsConfig = dto.inputsConfig;
    if (dto.formulaConfig !== undefined) app.formulaConfig = dto.formulaConfig;
    if (dto.uiConfig !== undefined) app.uiConfig = dto.uiConfig;

    return this.appRepository.save(app);
  }

  async remove(appId: string): Promise<{ message: string }> {
    const app = await this.findOne(appId);
    await this.appRepository.remove(app);
    return { message: `Calculator tool "${appId}" removed successfully` };
  }

  async share(appId: string, dto: ShareAppDto): Promise<{ message: string }> {
    await this.findOne(appId);

    const targetUser = await this.userRepository.findOne({
      where: [
        { username: dto.targetUsernameOrEmail },
        { email: dto.targetUsernameOrEmail },
      ],
    });
    if (!targetUser) {
      throw new NotFoundException(`User "${dto.targetUsernameOrEmail}" not found`);
    }

    let mapping = await this.mappingRepository.findOne({
      where: { app_id: appId, user_id: targetUser.id },
    });
    if (!mapping) {
      mapping = this.mappingRepository.create({
        app_id: appId,
        user_id: targetUser.id,
        status: true,
      });
      await this.mappingRepository.save(mapping);
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
      where: { user_id: targetUser.id, app_id: appId },
    });
    if (userPerm) {
      userPerm.permission_id = permission.id;
    } else {
      userPerm = this.userPermissionRepository.create({
        user_id: targetUser.id,
        app_id: appId,
        permission_id: permission.id,
      });
    }
    await this.userPermissionRepository.save(userPerm);

    return {
      message: `Successfully granted permission (read=${wantRead}, write=${wantWrite}) for app "${appId}" to user "${targetUser.username}"`,
    };
  }

  async calculate(appId: string, userId: string, dto: CalculateAppDto) {
    const app = await this.findOne(appId);
    if (!app.formulaConfig) {
      throw new BadRequestException(`Calculator tool "${appId}" has no formulaConfig rules configured`);
    }

    const computeUrl = process.env.COMPUTE_SERVICE_URL || 'http://localhost:8085';
    let computeRes: any;

    try {
      const response = await fetch(`${computeUrl}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: dto.payload,
          formulaConfig: app.formulaConfig,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new BadRequestException(errData.message || 'Formula computation failed');
      }

      computeRes = await response.json();
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Go Compute Engine unavailable (${err.message})`);
    }

    let savedRecord: AppRecord | null = null;
    if (dto.saveRecord) {
      const recordDateStr = new Date().toISOString().split('T')[0];
      const record = this.recordRepository.create({
        app_id: appId,
        user_id: userId,
        payload: dto.payload,
        results: computeRes.results,
        record_date: recordDateStr,
      });
      savedRecord = await this.recordRepository.save(record);
    }

    return {
      app_id: appId,
      app_name: app.name,
      payload: dto.payload,
      results: computeRes.results,
      execution_time_ms: computeRes.duration_ms,
      saved_record: savedRecord,
    };
  }
}
