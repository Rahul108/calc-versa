import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { getJwtSecret } from '../common/config/jwt.config';
import {
  User,
  App,
  UsersNAppMapping,
  Permission,
  UserPermission,
  AppRecord,
} from '../db';

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
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
