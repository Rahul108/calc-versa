import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { ShareAppDto } from './dto/share-app.dto';
import { CalculateAppDto } from './dto/calculate-app.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermissionGuard } from '../auth/guards/app-permission.guard';
import { RequireAppPermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('Apps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new calculator tool template & configuration' })
  @ApiResponse({ status: 201, description: 'Calculator tool created successfully' })
  async create(@Request() req: any, @Body() dto: CreateAppDto) {
    return this.appsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all calculator tools accessible to the current user' })
  @ApiResponse({ status: 200, description: 'List of accessible calculation tools' })
  async findAll(@Request() req: any) {
    return this.appsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Get full calculator tool configuration by ID' })
  @ApiResponse({ status: 200, description: 'Calculator tool configuration details' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks read permission for this tool' })
  async findOne(@Param('id') id: string) {
    return this.appsService.findOne(id);
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
  @RequireAppPermission('write')
  @ApiOperation({ summary: 'Delete a calculator tool instance' })
  @ApiResponse({ status: 200, description: 'Calculator tool deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks write permission for this tool' })
  async remove(@Param('id') id: string) {
    return this.appsService.remove(id);
  }

  @Post(':id/share')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('write')
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
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CalculateAppDto,
  ) {
    return this.appsService.calculate(id, req.user.id, dto);
  }
}
