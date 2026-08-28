import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../../libs/db/src';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new ConflictException(
        'Username or Email already registered in system',
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
      address: dto.address,
      contact_no: dto.contact_no,
      status: true,
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`Registered new user account: ${savedUser.username} (${savedUser.id})`);

    const { password, ...result } = savedUser;
    return {
      message: 'User account registered successfully',
      user: result,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [
        { username: dto.usernameOrEmail },
        { email: dto.usernameOrEmail },
      ],
    });

    if (!user || !user.status) {
      throw new UnauthorizedException('Invalid credentials or inactive user account');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`User logged in: ${user.username} (${user.id})`);

    return {
      message: 'Login successful',
      access_token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    const { password, ...result } = user;
    return result;
  }
}
