import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'Username or registered email address' })
  @IsNotEmpty()
  @IsString()
  usernameOrEmail!: string;

  @ApiProperty({ example: 'Password123!', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
