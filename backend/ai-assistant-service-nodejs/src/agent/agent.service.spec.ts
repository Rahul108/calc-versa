import { AgentService } from './agent.service';
import { ForbiddenException } from '@nestjs/common';

describe('AgentService (AI RAG Pipeline & Safety Guardrails)', () => {
  let service: AgentService;
  let mockGeminiService: any;

  beforeEach(() => {
    mockGeminiService = {
      analyzeFeasibility: jest.fn().mockResolvedValue({
        possible: true,
        confidence: 0.95,
        tool_name: 'Mortgage Calculator',
        description: 'Calculates monthly mortgage payments',
        extracted_inputs: [{ id: 'principal', label: 'Amount', type: 'number', defaultValue: 300000 }],
        suggested_formula: {
          rules: [{ targetOutputId: 'monthly_payment', expression: 'principal * 0.05' }],
        },
        reasoning: 'Supported by CalcVersa engine',
      }),
      generateSchemaUpdate: jest.fn().mockResolvedValue({
        inputsConfig: { sections: [] },
        formulaConfig: { rules: [] },
        summary: 'Added tax field',
      }),
      generateGuidance: jest.fn().mockResolvedValue('Step by step guidance'),
    };

    service = new AgentService(mockGeminiService);
  });

  it('should evaluate tool feasibility and return dry-run draft schema with requires_user_confirmation: true', async () => {
    const res = await service.evaluateFeasibility({
      prompt: 'Create a Mortgage Calculator with Loan Amount',
    });

    expect(res.possible).toBe(true);
    expect(res.confidence).toBe(0.95);
    expect(res.safety_validated).toBe(true);
    expect(res.requires_user_confirmation).toBe(true);
    expect(res.tool_draft.name).toBe('Mortgage Calculator');
  });

  it('should refuse to create tool if user_confirmed is false (Zero-Trust Guardrail)', async () => {
    await expect(
      service.createTool({
        user_confirmed: false,
        tool_draft: { name: 'Unconfirmed Tool' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should refuse to update tool if user_confirmed is false (Zero-Trust Guardrail)', async () => {
    await expect(
      service.updateTool({
        appId: 'test-app-id',
        modificationPrompt: 'Add tax rate',
        user_confirmed: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
