import { Controller, Post, Get, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { GatewayAuthGuard } from '../common/guards/gateway-auth.guard';
import { AgentService } from './agent.service';
import { GuidePromptDto } from '../dto/guide-prompt.dto';
import { OperatePromptDto } from '../dto/operate-prompt.dto';
import { ReportRequestDto } from '../dto/report-request.dto';
import { FeasibilityPromptDto } from '../dto/feasibility-prompt.dto';
import { CreateToolPromptDto } from '../dto/create-tool-prompt.dto';
import { UpdateToolPromptDto } from '../dto/update-tool-prompt.dto';

@UseGuards(GatewayAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('feasibility')
  async feasibility(@Body() dto: FeasibilityPromptDto) {
    return this.agentService.evaluateFeasibility(dto);
  }

  @Post('create-tool')
  async createTool(@Body() dto: CreateToolPromptDto, @Headers('authorization') authHeader: string) {
    // Always act with the token the guard verified, never one supplied in the body.
    dto.userToken = authHeader;
    return this.agentService.createTool(dto);
  }

  @Post('update-tool')
  async updateTool(@Body() dto: UpdateToolPromptDto, @Headers('authorization') authHeader: string) {
    dto.userToken = authHeader;
    return this.agentService.updateTool(dto);
  }

  @Post('guide')
  async guide(@Body() dto: GuidePromptDto) {
    return this.agentService.getGuidance(dto);
  }

  @Post('operate')
  async operate(@Body() dto: OperatePromptDto) {
    return this.agentService.performOperation(dto);
  }

  @Get('report')
  async getReportGet(@Query() dto: ReportRequestDto, @Headers('authorization') authHeader: string) {
    return this.agentService.getReport(dto, authHeader);
  }

  @Post('report')
  async getReportPost(@Body() dto: ReportRequestDto, @Headers('authorization') authHeader: string) {
    return this.agentService.getReport(dto, authHeader);
  }
}
