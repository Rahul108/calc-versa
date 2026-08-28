import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { GuidePromptDto } from '../dto/guide-prompt.dto';
import { OperatePromptDto } from '../dto/operate-prompt.dto';
import { ReportRequestDto } from '../dto/report-request.dto';
import { FeasibilityPromptDto } from '../dto/feasibility-prompt.dto';
import { CreateToolPromptDto } from '../dto/create-tool-prompt.dto';
import { UpdateToolPromptDto } from '../dto/update-tool-prompt.dto';
import { sanitizeFormulaExpression } from '../common/sanitizer';

@Injectable()
export class AgentService {
  constructor(private readonly geminiService: GeminiService) {}

  async evaluateFeasibility(dto: FeasibilityPromptDto) {
    const analysis = await this.geminiService.analyzeFeasibility(dto.prompt);

    const warnings: string[] = [];

    // Guardrail 1: Check confidence threshold (>= 0.85)
    if (analysis.confidence !== undefined && analysis.confidence < 0.85) {
      analysis.possible = false;
      warnings.push(`Low confidence score (${analysis.confidence}). Requirement prompt is ambiguous.`);
    }

    // Guardrail 2: Sanitize all generated formula expressions
    if (analysis.suggested_formula && analysis.suggested_formula.rules) {
      for (const rule of analysis.suggested_formula.rules) {
        try {
          rule.expression = sanitizeFormulaExpression(rule.expression);
        } catch (err: any) {
          analysis.possible = false;
          warnings.push(`Formula expression safety check failed for rule '${rule.targetOutputId}': ${err.message}`);
        }
      }
    }

    const toolDraft = {
      name: analysis.tool_name || 'Custom Calculator Tool',
      description: analysis.description || `Tool created from prompt: "${dto.prompt}"`,
      inputsConfig: {
        sections: [
          {
            title: 'User Input Parameters',
            fields: analysis.extracted_inputs || [],
          },
        ],
      },
      formulaConfig: analysis.suggested_formula || { rules: [] },
      uiConfig: { theme: 'dark', primaryColor: '#6366f1' },
    };

    return {
      possible: analysis.possible ?? true,
      confidence: analysis.confidence ?? 0.9,
      safety_validated: warnings.length === 0,
      requires_user_confirmation: true,
      tool_draft: toolDraft,
      reasoning: analysis.reasoning || 'Evaluated against CalcVersa system capabilities.',
      safety_warnings: warnings,
      timestamp: new Date().toISOString(),
    };
  }

  async createTool(dto: CreateToolPromptDto) {
    // Guardrail: Require explicit user confirmation
    if (!dto.user_confirmed) {
      throw new ForbiddenException(
        'AI Guardrail Error: User explicit confirmation (user_confirmed: true) is required to execute tool creation.',
      );
    }

    // Sanitize formulas in tool draft
    if (dto.tool_draft.formulaConfig && dto.tool_draft.formulaConfig.rules) {
      for (const rule of dto.tool_draft.formulaConfig.rules) {
        rule.expression = sanitizeFormulaExpression(rule.expression);
      }
    }

    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3005';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (dto.userToken) {
      headers['Authorization'] = dto.userToken.startsWith('Bearer ')
        ? dto.userToken
        : `Bearer ${dto.userToken}`;
    }

    try {
      const response = await fetch(`${apiGatewayUrl}/apps`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dto.tool_draft),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new BadRequestException(errJson.message || 'Failed to create calculator tool in API Gateway');
      }

      const createdApp = await response.json();
      return {
        message: 'Calculator tool successfully created and instantiated',
        app: createdApp,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof BadRequestException) throw err;
      throw new BadRequestException(`API Gateway connection failed: ${err.message}`);
    }
  }

  async updateTool(dto: UpdateToolPromptDto) {
    // Guardrail: Require explicit user confirmation
    if (!dto.user_confirmed) {
      throw new ForbiddenException(
        'AI Guardrail Error: User explicit confirmation (user_confirmed: true) is required to execute tool modifications.',
      );
    }

    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3005';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (dto.userToken) {
      headers['Authorization'] = dto.userToken.startsWith('Bearer ')
        ? dto.userToken
        : `Bearer ${dto.userToken}`;
    }

    // Step 1: Fetch existing app schema
    const fetchRes = await fetch(`${apiGatewayUrl}/apps/${dto.appId}`, { headers });
    if (!fetchRes.ok) {
      throw new NotFoundException(`Calculator tool with ID "${dto.appId}" not found or access denied`);
    }
    const existingApp = await fetchRes.json();

    // Step 2: Use Gemini to merge schema updates
    const updatedSchema = await this.geminiService.generateSchemaUpdate(
      existingApp,
      dto.modificationPrompt,
    );

    // Guardrail: Sanitize updated formulas
    if (updatedSchema.formulaConfig && updatedSchema.formulaConfig.rules) {
      for (const rule of updatedSchema.formulaConfig.rules) {
        rule.expression = sanitizeFormulaExpression(rule.expression);
      }
    }

    // Step 3: Put updated schema back to API Gateway
    const updateRes = await fetch(`${apiGatewayUrl}/apps/${dto.appId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        inputsConfig: updatedSchema.inputsConfig,
        formulaConfig: updatedSchema.formulaConfig,
      }),
    });

    if (!updateRes.ok) {
      const errJson = await updateRes.json();
      throw new BadRequestException(errJson.message || 'Failed to update calculator tool');
    }

    const updatedApp = await updateRes.json();
    return {
      message: 'Calculator tool successfully updated',
      app: updatedApp,
      summary: updatedSchema.summary,
      timestamp: new Date().toISOString(),
    };
  }

  async getGuidance(dto: GuidePromptDto) {
    const guidanceText = await this.geminiService.generateGuidance(
      dto.prompt,
      dto.context,
    );

    return {
      prompt: dto.prompt,
      guidance: guidanceText,
      timestamp: new Date().toISOString(),
    };
  }

  async performOperation(dto: OperatePromptDto) {
    const result = await this.geminiService.processOperation(
      dto.action,
      dto.prompt,
      dto.targetId,
    );

    return {
      operation: dto.action,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  async getReport(dto: ReportRequestDto) {
    const reportData = await this.geminiService.generateReport(
      dto.reportType || 'usage_summary',
    );

    return {
      report: reportData,
      timestamp: new Date().toISOString(),
    };
  }
}
