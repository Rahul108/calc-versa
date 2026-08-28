import { IsOptional, IsString } from 'class-validator';

export class ReportRequestDto {
  @IsOptional()
  @IsString()
  reportType?: string; // e.g. "usage_summary", "operations_log", "performance"

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
