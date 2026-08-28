import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { GuidePromptDto } from '../dto/guide-prompt.dto';
import { OperatePromptDto } from '../dto/operate-prompt.dto';
import { ReportRequestDto } from '../dto/report-request.dto';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('guide')
  async guide(@Body() dto: GuidePromptDto) {
    return this.agentService.getGuidance(dto);
  }

  @Post('operate')
  async operate(@Body() dto: OperatePromptDto) {
    return this.agentService.performOperation(dto);
  }

  @Get('report')
  async getReportGet(@Query() dto: ReportRequestDto) {
    return this.agentService.getReport(dto);
  }

  @Post('report')
  async getReportPost(@Body() dto: ReportRequestDto) {
    return this.agentService.getReport(dto);
  }
}
