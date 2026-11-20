import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermissionGuard } from '../auth/guards/app-permission.guard';
import { RequireAppPermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('permissions/me')
  @ApiOperation({ summary: 'Get all calculator tool permissions granted to the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of user permissions across all tools' })
  async getMyPermissions(@CurrentUser() user: AuthenticatedUser) {
    return this.permissionsService.getMyPermissions(user.id);
  }

  @Get('apps/:id/permissions')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('owner')
  @ApiOperation({ summary: 'List all user access grants and permission levels for a calculator tool' })
  @ApiResponse({ status: 200, description: 'List of users and their read/write permissions for this app' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only the tool owner can view permissions' })
  async getAppPermissions(@Param('id') appId: string) {
    return this.permissionsService.getAppPermissions(appId);
  }

  @Put('apps/:id/permissions/:userId')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('owner')
  @ApiOperation({ summary: 'Update a specific user permission (read, write) for a calculator tool' })
  @ApiResponse({ status: 200, description: 'User permission updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only the tool owner can manage permissions' })
  async updateUserPermission(
    @Param('id') appId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: UpdateUserPermissionDto,
  ) {
    return this.permissionsService.updateUserPermission(appId, targetUserId, dto);
  }

  @Delete('apps/:id/permissions/:userId')
  @UseGuards(AppPermissionGuard)
  @RequireAppPermission('owner')
  @ApiOperation({ summary: 'Revoke a user permission and access mapping for a calculator tool' })
  @ApiResponse({ status: 200, description: 'User access revoked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only the tool owner can manage permissions' })
  async revokeUserPermission(
    @Param('id') appId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.permissionsService.revokeUserPermission(appId, targetUserId);
  }
}
