import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginRateLimitGuard } from '../common/guards/login-rate-limit.guard';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'User account registered successfully' })
  @ApiResponse({ status: 409, description: 'Username or Email already registered' })
  @UseGuards(LoginRateLimitGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and obtain JWT access token' })
  @ApiResponse({ status: 200, description: 'Login successful, returns Bearer token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or inactive account' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized / invalid token' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
