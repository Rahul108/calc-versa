import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';
import {
  App,
  UsersNAppMapping,
  UserPermission,
  Permission,
  User,
  AppRecord,
} from '../../../../libs/db/src';

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
  ],
  controllers: [AppsController],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
