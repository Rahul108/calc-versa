import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Account password (min 6 chars)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  first_name!: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  last_name!: string;

  @ApiProperty({ example: '123 Main St, New York', description: 'User physical address' })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty({ example: '+1234567890', description: 'Contact phone number' })
  @IsNotEmpty()
  @IsString()
  contact_no!: string;
}
