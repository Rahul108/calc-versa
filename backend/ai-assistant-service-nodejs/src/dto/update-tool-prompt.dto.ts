import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateToolPromptDto {
  @IsNotEmpty()
  @IsString()
  appId!: string;

  @IsNotEmpty()
  @IsString()
  modificationPrompt!: string;

  @IsNotEmpty()
  @IsBoolean()
  user_confirmed!: boolean;

  @IsOptional()
  @IsString()
  userToken?: string;
}
