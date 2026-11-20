import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import {
  UserPermission,
  Permission,
  UsersNAppMapping,
  App,
  User,
} from '../db';
import { AppAccessModule } from '../auth/app-access.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPermission,
      Permission,
      UsersNAppMapping,
      App,
      User,
    ]),
    AppAccessModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
