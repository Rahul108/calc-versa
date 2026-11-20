import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { AppRecord, UsersNAppMapping, UserPermission, Permission } from '../db';
import { AppAccessModule } from '../auth/app-access.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppRecord,
      UsersNAppMapping,
      UserPermission,
      Permission,
    ]),
    AppAccessModule,
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
