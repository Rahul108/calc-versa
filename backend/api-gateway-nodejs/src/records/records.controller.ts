import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermissionGuard } from '../auth/guards/app-permission.guard';
import { RequireAppPermission } from '../auth/decorators/require-permission.decorator';

@ApiTags('Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('write')
  @ApiOperation({ summary: 'Submit user inputs and calculation results log entry' })
  @ApiResponse({ status: 201, description: 'Calculation record logged successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks write permission for this app' })
  async create(@Request() req: any, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('read')
  @ApiOperation({ summary: 'Query date-range calculation records for an app (weekly, monthly, yearly reports)' })
  @ApiResponse({ status: 200, description: 'Filtered list of calculation records' })
  @ApiResponse({ status: 403, description: 'Forbidden - User lacks read permission for this app' })
  async findAll(@Request() req: any, @Query() query: QueryRecordsDto) {
    return this.recordsService.findAllForApp(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific calculation record by ID' })
  @ApiResponse({ status: 200, description: 'Calculation record details' })
  async findOne(@Param('id') id: string) {
    return this.recordsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete calculation record' })
  @ApiResponse({ status: 200, description: 'Calculation record deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
