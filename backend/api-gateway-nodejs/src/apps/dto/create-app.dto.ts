import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiProperty({ example: 'Mortgage Loan Calculator', description: 'Name of the calculation tool' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Calculates monthly payment and total interest', description: 'Tool description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    example: {
      sections: [
        {
          title: 'Loan Details',
          fields: [
            { id: 'principal', label: 'Loan Amount', type: 'number', defaultValue: 300000 },
            { id: 'annual_rate', label: 'Interest Rate', type: 'slider', defaultValue: 6.5 },
          ],
        },
      ],
    },
    description: 'Dynamic form inputs configuration JSON',
  })
  @IsOptional()
  @IsObject()
  inputsConfig?: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      engine: 'standard',
      outputs: [{ id: 'monthly_payment', label: 'Monthly Payment', format: 'currency' }],
      rules: [{ targetOutputId: 'monthly_payment', expression: '(principal * r) / (1 - (1 + r)^-n)' }],
    },
    description: 'Mathematical rules and expressions configuration JSON',
  })
  @IsOptional()
  @IsObject()
  formulaConfig?: Record<string, any>;

  @ApiPropertyOptional({
    example: { theme: 'dark', primaryColor: '#4f46e5' },
    description: 'Custom UI layout and styling theme JSON',
  })
  @IsOptional()
  @IsObject()
  uiConfig?: Record<string, any>;
}
