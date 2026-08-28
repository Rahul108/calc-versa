import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppPermissionGuard } from './guards/app-permission.guard';
import {
  User,
  App,
  UsersNAppMapping,
  UserPermission,
} from '../../../../libs/db/src';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, App, UsersNAppMapping, UserPermission]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'calcversa_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, AppPermissionGuard],
  exports: [AuthService, JwtAuthGuard, AppPermissionGuard, JwtModule],
})
export class AuthModule {}
