import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import {
  User,
  App,
  UsersNAppMapping,
  Permission,
  UserPermission,
  AppRecord,
} from '../../../libs/db/src';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'calcversa_user',
      password: process.env.DB_PASSWORD || 'calcversa_pass',
      database: process.env.DB_NAME || 'calcversa',
      entities: [
        User,
        App,
        UsersNAppMapping,
        Permission,
        UserPermission,
        AppRecord,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
