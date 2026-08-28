import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateToolPromptDto {
  @IsNotEmpty()
  @IsBoolean()
  user_confirmed!: boolean;

  @IsNotEmpty()
  @IsObject()
  tool_draft!: Record<string, any>;

  @IsOptional()
  @IsString()
  userToken?: string;
}
