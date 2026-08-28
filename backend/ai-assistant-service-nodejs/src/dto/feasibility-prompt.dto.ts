import { IsNotEmpty, IsString } from 'class-validator';

export class FeasibilityPromptDto {
  @IsNotEmpty()
  @IsString()
  prompt!: string;
}
