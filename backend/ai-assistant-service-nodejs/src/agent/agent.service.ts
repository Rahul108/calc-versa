import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { GuidePromptDto } from '../dto/guide-prompt.dto';
import { OperatePromptDto } from '../dto/operate-prompt.dto';
import { ReportRequestDto } from '../dto/report-request.dto';

@Injectable()
export class AgentService {
  constructor(private readonly geminiService: GeminiService) {}

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
