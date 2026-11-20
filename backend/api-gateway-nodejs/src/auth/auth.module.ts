import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AppAccessModule } from './app-access.module';
import { getJwtSecret } from '../common/config/jwt.config';
import {
  User,
  App,
  UsersNAppMapping,
  UserPermission,
} from '../db';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, App, UsersNAppMapping, UserPermission]),
    AppAccessModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, AppAccessModule, JwtModule],
})
export class AuthModule {}
