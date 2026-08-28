import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  User,
  App,
  UsersNAppMapping,
  Permission,
  UserPermission,
  AppRecord,
} from '../../../../libs/db/src';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
    @InjectRepository(UsersNAppMapping)
    private readonly mappingRepository: Repository<UsersNAppMapping>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(AppRecord)
    private readonly recordRepository: Repository<AppRecord>,
    private readonly jwtService: JwtService,
  ) {}

  async adminLogin(usernameOrEmail: string, passwordStr: string) {
    const user = await this.userRepository.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.status) {
      throw new ForbiddenException('User account is inactive');
    }

    if (!user.is_admin) {
      throw new ForbiddenException('Access denied: Account lacks Super-Admin privileges');
    }

    const isMatch = await bcrypt.compare(passwordStr, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      is_admin: true,
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'calcversa_secret_jwt_key_2026',
      expiresIn: '7d',
    });

    return {
      message: 'Admin authentication successful',
      admin_token: token,
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const totalApps = await this.appRepository.count();
    const totalRecords = await this.recordRepository.count();
    const totalPermissions = await this.permissionRepository.count();

    return {
      total_users: totalUsers,
      total_apps: totalApps,
      total_records: totalRecords,
      total_permissions: totalPermissions,
    };
  }

  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'first_name', 'last_name', 'status', 'is_admin', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  async toggleAdminRole(userId: string, isAdmin: boolean) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }
    user.is_admin = isAdmin;
    await this.userRepository.save(user);
    return { message: `User "${user.username}" admin status updated to ${isAdmin}`, user };
  }

  async getAllApps() {
    return this.appRepository.find({ order: { created_at: 'DESC' } });
  }

  async getAllRecords() {
    return this.recordRepository.find({
      order: { created_at: 'DESC' },
      take: 100,
    });
  }
}
