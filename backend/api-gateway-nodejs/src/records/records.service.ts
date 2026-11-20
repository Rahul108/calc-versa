import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, type FindOptionsWhere } from 'typeorm';
import { AppRecord } from '../db';
import { AppAccessService } from '../auth/app-access.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(AppRecord)
    private readonly recordRepository: Repository<AppRecord>,
    private readonly appAccessService: AppAccessService,
  ) {}

  async create(userId: string, dto: CreateRecordDto): Promise<AppRecord> {
    const recordDateStr = dto.record_date
      ? dto.record_date
      : new Date().toISOString().split('T')[0];

    const record = this.recordRepository.create({
      app_id: dto.app_id,
      user_id: userId,
      payload: dto.payload,
      results: dto.results || null,
      record_date: recordDateStr,
    });

    return this.recordRepository.save(record);
  }

  async findAllForApp(userId: string, query: QueryRecordsDto): Promise<AppRecord[]> {
    // Same visibility as GET /apps/:id/records: anyone with read access to the app
    // sees all of its records; `mine=true` narrows to the caller's own records.
    const whereClause: FindOptionsWhere<AppRecord> = { app_id: query.app_id };
    if (query.mine) {
      whereClause.user_id = userId;
    }

    if (query.startDate && query.endDate) {
      whereClause.record_date = Between(query.startDate, query.endDate);
    } else if (query.startDate) {
      whereClause.record_date = MoreThanOrEqual(query.startDate);
    } else if (query.endDate) {
      whereClause.record_date = LessThanOrEqual(query.endDate);
    }

    return this.recordRepository.find({
      where: whereClause,
      order: { record_date: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Loads a record and checks the caller's permission on the record's app.
   * Unknown records and records on apps the caller cannot see both return 404,
   * so record IDs cannot be probed.
   */
  async findOneForUser(
    userId: string,
    recordId: string,
    required: 'read' | 'write' = 'read',
  ): Promise<AppRecord> {
    const record = await this.recordRepository.findOne({ where: { id: recordId } });
    const notFound = new NotFoundException(`Calculation record "${recordId}" not found`);
    if (!record) throw notFound;

    const access = await this.appAccessService.getAccess(userId, record.app_id);
    if (!access) throw notFound;
    if (!access[required]) {
      throw new ForbiddenException(
        `Access denied: You do not have '${required}' permission for this record's app`,
      );
    }
    return record;
  }

  async removeForUser(userId: string, recordId: string): Promise<{ message: string }> {
    const record = await this.findOneForUser(userId, recordId, 'write');
    await this.recordRepository.remove(record);
    return { message: `Calculation record "${recordId}" deleted successfully` };
  }
}
