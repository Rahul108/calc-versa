import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../db';
import { getJwtSecret } from '../../common/config/jwt.config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, {
        secret: getJwtSecret(),
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user || !user.status) {
        throw new UnauthorizedException('User account inactive or not found');
      }

      if (!user.is_admin) {
        throw new ForbiddenException('Access denied: Super-Admin privileges required');
      }

      request.user = { id: user.id, username: user.username, email: user.email };
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired admin session token');
    }
  }
}
