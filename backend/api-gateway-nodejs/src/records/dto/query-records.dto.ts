import { IsNotEmpty, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryRecordsDto {
  @ApiProperty({ example: 'a9b9dea5-9026-45b5-b494-bcc347eba1d1', description: 'Calculator App ID' })
  @IsNotEmpty()
  @IsUUID()
  app_id!: string;

  @ApiPropertyOptional({ example: '2026-08-01', description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Only return records created by the current user (default: all records of the app)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;
}
