import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersNAppMapping, UserPermission } from '../db';
import { AppAccessService } from './app-access.service';
import { AppPermissionGuard } from './guards/app-permission.guard';

/**
 * Shared app-level authorization. Import this module anywhere AppPermissionGuard
 * or AppAccessService is used so the guard's dependencies resolve.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UsersNAppMapping, UserPermission])],
  providers: [AppAccessService, AppPermissionGuard],
  exports: [AppAccessService, AppPermissionGuard],
})
export class AppAccessModule {}
