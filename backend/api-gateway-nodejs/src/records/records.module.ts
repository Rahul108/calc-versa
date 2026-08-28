import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { AppRecord, UsersNAppMapping, UserPermission, Permission } from '../../../../libs/db/src';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppRecord,
      UsersNAppMapping,
      UserPermission,
      Permission,
    ]),
  ],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
