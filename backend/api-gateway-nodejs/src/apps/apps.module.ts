import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import { ComputeClientService } from './compute-client.service';
import { RecordAnalyticsService } from './record-analytics.service';
import {
  App,
  UsersNAppMapping,
  UserPermission,
  Permission,
  User,
  AppRecord,
} from '../db';
import { AppAccessModule } from '../auth/app-access.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      App,
      UsersNAppMapping,
      UserPermission,
      Permission,
      User,
      AppRecord,
    ]),
    AppAccessModule,
  ],
  controllers: [AppsController],
  providers: [AppsService, ComputeClientService, RecordAnalyticsService],
  exports: [AppsService],
})
export class AppsModule {}
