import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminRoleDto {
  @ApiProperty({ example: true, description: 'Grant (true) or remove (false) Super-Admin role' })
  @IsBoolean()
  is_admin!: boolean;
}
