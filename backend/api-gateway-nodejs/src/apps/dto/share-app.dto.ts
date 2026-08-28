import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareAppDto {
  @ApiProperty({ example: 'janedoe', description: 'Username or email of the user to grant permission' })
  @IsNotEmpty()
  @IsString()
  targetUsernameOrEmail!: string;

  @ApiPropertyOptional({ example: true, description: 'Grant read access' })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Grant write access' })
  @IsOptional()
  @IsBoolean()
  write?: boolean;
}
