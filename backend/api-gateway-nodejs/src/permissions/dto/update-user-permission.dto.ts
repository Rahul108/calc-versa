import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserPermissionDto {
  @ApiPropertyOptional({ example: true, description: 'Read permission grant status' })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Write permission grant status' })
  @IsOptional()
  @IsBoolean()
  write?: boolean;
}
