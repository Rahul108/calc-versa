import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import {
  User,
  App,
  UsersNAppMapping,
  Permission,
  UserPermission,
  AppRecord,
} from '../../../../libs/db/src';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      App,
      UsersNAppMapping,
      Permission,
      UserPermission,
      AppRecord,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'calcversa_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
