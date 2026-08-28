import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GuidePromptDto {
  @IsNotEmpty()
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
