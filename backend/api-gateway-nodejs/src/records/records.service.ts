import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppRecord } from '../../../../libs/db/src';
import { CreateRecordDto } from './dto/create-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(AppRecord)
    private readonly recordRepository: Repository<AppRecord>,
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
    const whereClause: any = {
      app_id: query.app_id,
      user_id: userId,
    };

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

  async findOne(recordId: string): Promise<AppRecord> {
    const record = await this.recordRepository.findOne({ where: { id: recordId } });
    if (!record) {
      throw new NotFoundException(`Calculation record "${recordId}" not found`);
    }
    return record;
  }

  async remove(recordId: string): Promise<{ message: string }> {
    const record = await this.findOne(recordId);
    await this.recordRepository.remove(record);
    return { message: `Calculation record "${recordId}" deleted successfully` };
  }
}
