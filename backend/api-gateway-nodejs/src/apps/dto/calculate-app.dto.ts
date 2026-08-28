import { IsBoolean, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalculateAppDto {
  @ApiProperty({
    example: { principal: 350000, annual_rate: 6.5, term_years: 30 },
    description: 'Input parameters matching the inputsConfig schema',
  })
  @IsNotEmpty()
  @IsObject()
  payload!: Record<string, any>;

  @ApiPropertyOptional({ example: true, description: 'Automatically log calculation run to AppRecord history' })
  @IsOptional()
  @IsBoolean()
  saveRecord?: boolean;
}
