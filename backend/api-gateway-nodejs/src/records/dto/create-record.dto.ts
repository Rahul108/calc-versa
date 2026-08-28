import { IsNotEmpty, IsOptional, IsString, IsObject, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({ example: 'a9b9dea5-9026-45b5-b494-bcc347eba1d1', description: 'ID of the calculation app' })
  @IsNotEmpty()
  @IsUUID()
  app_id!: string;

  @ApiProperty({
    example: { principal: 350000, annual_rate: 6.5, term_years: 30 },
    description: 'Submitted user inputs JSON payload',
  })
  @IsNotEmpty()
  @IsObject()
  payload!: Record<string, any>;

  @ApiPropertyOptional({
    example: { monthly_payment: 2212.24, total_interest: 446406.4 },
    description: 'Calculated outputs JSON results',
  })
  @IsOptional()
  @IsObject()
  results?: Record<string, any>;

  @ApiPropertyOptional({ example: '2026-08-28', description: 'Record date (defaults to today)' })
  @IsOptional()
  @IsDateString()
  record_date?: string;
}
