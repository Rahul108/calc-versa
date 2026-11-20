import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AppsModule } from './apps/apps.module';
import { RecordsModule } from './records/records.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AdminModule } from './admin/admin.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { DatabaseMigrationService } from './common/database/database-migration.service';
import { dataSourceOptions } from './db';

@Module({
  imports: [
    // Connection, entities and migrations come from libs/db so the gateway, CLI and
    // seeds share one definition. Schema changes go through migrations (see ADR 0010).
    // libs/db resolves its own `typeorm` copy, hence the cast; the runtime shape is identical.
    TypeOrmModule.forRoot(dataSourceOptions as unknown as TypeOrmModuleOptions),
    AuthModule,
    AppsModule,
    RecordsModule,
    PermissionsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseMigrationService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
