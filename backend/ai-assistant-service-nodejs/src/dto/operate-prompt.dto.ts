import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class OperatePromptDto {
  @IsNotEmpty()
  @IsString()
  action!: string; // e.g. "mark_resolved", "update_data", "find_info"

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
