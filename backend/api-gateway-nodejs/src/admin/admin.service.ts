import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
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
} from '../db';
import { getJwtSecret } from '../common/config/jwt.config';

// bcrypt hash of a random string; compared against when the user does not exist
// so that login timing does not reveal which usernames are registered.
const DUMMY_BCRYPT_HASH = '$2a$10$fD0JwEuD8PqjlrR/1iHtEOLd0eq4jq8SmDs6Idta0CFrm1w9c.AS2';

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

    // Always run bcrypt and return one generic error, so the response does not
    // reveal whether the account exists, is inactive, or is an admin.
    const isMatch = await bcrypt.compare(passwordStr, user?.password ?? DUMMY_BCRYPT_HASH);
    if (!user || !isMatch || !user.status || !user.is_admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      is_admin: true,
    };

    const token = this.jwtService.sign(payload, {
      secret: getJwtSecret(),
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

  async toggleAdminRole(actingAdminId: string, userId: string, isAdmin: boolean) {
    if (actingAdminId === userId && !isAdmin) {
      throw new BadRequestException('You cannot remove your own Super-Admin role');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }
    user.is_admin = isAdmin;
    await this.userRepository.save(user);
    const { password, ...safeUser } = user;
    return { message: `User "${user.username}" admin status updated to ${isAdmin}`, user: safeUser };
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
