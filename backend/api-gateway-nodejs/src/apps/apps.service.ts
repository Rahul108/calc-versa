import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  App,
  UsersNAppMapping,
  UserPermission,
  Permission,
  User,
  AppRecord,
} from '../db';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ShareAppDto } from './dto/share-app.dto';
import { CalculateAppDto } from './dto/calculate-app.dto';
import { ComputeClientService } from './compute-client.service';
import { RecordAnalyticsService } from './record-analytics.service';
import { AppAccessService } from '../auth/app-access.service';

@Injectable()
export class AppsService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppRecord)
    private readonly recordRepository: Repository<AppRecord>,
    private readonly dataSource: DataSource,
    private readonly computeClient: ComputeClientService,
    private readonly recordAnalytics: RecordAnalyticsService,
    private readonly appAccess: AppAccessService,
  ) {}

  /** Tool names are unique per owner, not globally (avoids leaking other tenants' names). */
  private async assertNameAvailableForOwner(userId: string, name: string, excludeAppId?: string) {
    const qb = this.appRepository
      .createQueryBuilder('app')
      .innerJoin(UsersNAppMapping, 'm', 'm.app_id = app.id')
      .where('m.user_id = :userId', { userId })
      .andWhere('m.is_owner = true')
      .andWhere('app.name = :name', { name });
    if (excludeAppId) qb.andWhere('app.id <> :excludeAppId', { excludeAppId });
    if (await qb.getExists()) {
      throw new ConflictException(`You already have a calculator tool named "${name}"`);
    }
  }

  async create(userId: string, dto: CreateAppDto): Promise<App> {
    await this.assertNameAvailableForOwner(userId, dto.name);

    return this.dataSource.transaction(async (manager) => {
      const savedApp = await manager.save(
        manager.create(App, {
          name: dto.name,
          description: dto.description,
          inputsConfig: dto.inputsConfig || null,
          formulaConfig: dto.formulaConfig || null,
          uiConfig: dto.uiConfig || null,
          status: true,
        }),
      );

      await manager.save(
        manager.create(UsersNAppMapping, {
          app_id: savedApp.id,
          user_id: userId,
          status: true,
          is_owner: true,
        }),
      );

      let fullPermission = await manager.findOne(Permission, {
        where: { read: true, write: true },
      });
      if (!fullPermission) {
        fullPermission = await manager.save(
          manager.create(Permission, { name: 'owner_full_access', read: true, write: true }),
        );
      }

      await manager.save(
        manager.create(UserPermission, {
          user_id: userId,
          app_id: savedApp.id,
          permission_id: fullPermission.id,
        }),
      );

      return savedApp;
    });
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
    if (dto.name !== undefined && dto.name !== app.name) {
      const owner = await this.mappingRepository.findOne({
        where: { app_id: appId, is_owner: true },
      });
      if (owner) await this.assertNameAvailableForOwner(owner.user_id, dto.name, appId);
      app.name = dto.name;
    }
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

    const wantRead = dto.read ?? true;
    const wantWrite = dto.write ?? false;
    await this.appAccess.grant(appId, targetUser.id, wantRead, wantWrite);

    return {
      message: `Successfully granted permission (read=${wantRead}, write=${wantWrite}) for app "${appId}" to user "${targetUser.username}"`,
    };
  }

  async calculate(appId: string, userId: string, dto: CalculateAppDto, correlationId?: string) {
    const app = await this.findOne(appId);
    if (!app.formulaConfig) {
      throw new BadRequestException(`Calculator tool "${appId}" has no formulaConfig rules configured`);
    }

    const computeRes = await this.computeClient.evaluate(
      dto.payload,
      app.formulaConfig,
      correlationId,
    );

    let savedRecord: AppRecord | null = null;
    if (dto.saveRecord) {
      const recordDateStr =
        dto.payload?.expense_date ||
        dto.payload?.record_date ||
        new Date().toISOString().split('T')[0];

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

  async getAppRecords(appId: string): Promise<AppRecord[]> {
    await this.findOne(appId);
    return this.recordRepository.find({
      where: { app_id: appId },
      order: { record_date: 'DESC', created_at: 'DESC' },
    });
  }

  async deleteAppRecord(appId: string, recordId: string): Promise<{ message: string }> {
    const record = await this.recordRepository.findOne({
      where: { id: recordId, app_id: appId },
    });
    if (!record) {
      throw new NotFoundException(`Record "${recordId}" not found for app "${appId}"`);
    }
    await this.recordRepository.remove(record);
    return { message: `Record "${recordId}" deleted successfully` };
  }

  /**
   * Aggregates an app's records in Postgres (see RecordAnalyticsService).
   * Field roles can be configured per tool via `uiConfig.analytics`.
   */
  async aggregateRecords(appId: string, startDate?: string, endDate?: string) {
    const app = await this.findOne(appId);
    const mapping = RecordAnalyticsService.fieldMappingFrom(app.uiConfig);
    const aggregation = await this.recordAnalytics.aggregate(appId, startDate, endDate, mapping);

    return {
      app_id: appId,
      startDate: startDate || 'Beginning',
      endDate: endDate || 'Latest',
      field_mapping: mapping,
      ...aggregation,
    };
  }
}
