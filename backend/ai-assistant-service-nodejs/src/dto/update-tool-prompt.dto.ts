import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateToolPromptDto {
  @IsNotEmpty()
  @IsUUID()
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
