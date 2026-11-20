import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ShareAppDto } from './dto/share-app.dto';
import { CalculateAppDto } from './dto/calculate-app.dto';
import { AggregateRecordsDto } from './dto/aggregate-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermissionGuard } from '../auth/guards/app-permission.guard';
import { RequireAppPermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Apps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new calculator tool template & configuration' })
  @ApiResponse({ status: 201, description: 'Calculator tool created successfully' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppDto) {
    return this.appsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all calculator tools accessible to the current user' })
  @ApiResponse({ status: 200, description: 'List of accessible calculation tools' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.appsService.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Get full calculator tool configuration by ID' })
  @ApiResponse({ status: 200, description: 'Calculator tool configuration details' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks read permission for this tool' })
  async findOne(@Req() req: ExpressRequest, @Param('id') id: string) {
    // Include the caller's access level so clients can hide actions they cannot perform.
    const app = await this.appsService.findOne(id);
    return { ...app, access: req.appAccess };
  }

  @Put(':id')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('write')
  @ApiOperation({ summary: 'Update calculator tool configuration (inputsConfig, formulaConfig, uiConfig)' })
  @ApiResponse({ status: 200, description: 'Calculator tool configuration updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks write permission for this tool' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppDto) {
    return this.appsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('owner')
  @ApiOperation({ summary: 'Delete a calculator tool instance' })
  @ApiResponse({ status: 200, description: 'Calculator tool deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only the tool owner can delete it' })
  async remove(@Param('id') id: string) {
    return this.appsService.remove(id);
  }

  @Post(':id/share')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('owner')
  @ApiOperation({ summary: 'Share calculator tool access with another user account' })
  @ApiResponse({ status: 200, description: 'Tool access shared successfully' })
  async share(@Param('id') id: string, @Body() dto: ShareAppDto) {
    return this.appsService.share(id, dto);
  }

  @Post(':id/calculate')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Execute real-time formula computation using Go Compute Engine (<2ms)' })
  @ApiResponse({ status: 200, description: 'Formula evaluation results computed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks read permission for this tool' })
  async calculate(
    @Req() req: ExpressRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CalculateAppDto,
  ) {
    // Running a calculation needs read; persisting it as a record needs write.
    if (dto.saveRecord && !req.appAccess?.write) {
      throw new ForbiddenException(
        `Access denied: saving records requires 'write' permission for App ID '${id}'`,
      );
    }
    return this.appsService.calculate(id, user.id, dto, req.correlationId);
  }

  @Get(':id/records')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Get all saved input calculation records for a calculator tool' })
  @ApiResponse({ status: 200, description: 'List of saved records returned successfully' })
  async getRecords(@Param('id') id: string) {
    return this.appsService.getAppRecords(id);
  }

  @Delete(':id/records/:recordId')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('write')
  @ApiOperation({ summary: 'Delete a single saved calculation record by ID' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  async deleteRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
  ) {
    return this.appsService.deleteAppRecord(id, recordId);
  }

  @Post(':id/aggregate')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Aggregate calculation logs over custom time intervals' })
  @ApiResponse({ status: 200, description: 'Aggregated calculation records returned successfully' })
  async aggregate(
    @Param('id') id: string,
    @Body() body: AggregateRecordsDto,
  ) {
    return this.appsService.aggregateRecords(id, body.startDate, body.endDate);
  }
}
