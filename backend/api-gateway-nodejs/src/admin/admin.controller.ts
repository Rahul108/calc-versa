import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Header,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { LoginDto } from '../auth/dto/login.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { readFileSync } from 'fs';
import { join } from 'path';

// Static admin console (plain HTML + inline script). Kept as a separate file so it can
// be edited with HTML tooling; copied next to the compiled controller by nest-cli assets.
const ADMIN_PANEL_HTML = readFileSync(join(__dirname, 'admin-panel.html'), 'utf8');
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Admin Panel')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate Super-Admin User Account' })
  @ApiResponse({ status: 200, description: 'Admin authentication successful' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  @UseGuards(LoginRateLimitGuard)
  async login(@Body() body: LoginDto) {
    return this.adminService.adminLogin(body.usernameOrEmail, body.password);
  }

  @Get()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Serve Interactive Admin Management Dashboard Web Interface' })
  getAdminPanelUI(): string {
    return ADMIN_PANEL_HTML;
  }

  @Get('api/stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Admin Dashboard Statistics Summary (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'Dashboard summary statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('api/users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user accounts for admin inspection (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of all user accounts' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('api/users/:id/role')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user admin status (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'User admin status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async toggleAdminRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.adminService.toggleAdminRole(admin.id, id, dto.is_admin);
  }

  @Get('api/apps')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calculator tools and configurations (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of all calculator tools' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getApps() {
    return this.adminService.getAllApps();
  }

  @Get('api/records')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calculation records (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of calculation records' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getRecords() {
    return this.adminService.getAllRecords();
  }
}
