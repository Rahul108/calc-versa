import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User.entity';
import { App } from './entities/App.entity';
import { UsersNAppMapping } from './entities/UsersNAppMapping.entity';
import { Permission } from './entities/Permission.entity';
import { UserPermission } from './entities/UserPermission.entity';
import { AppRecord } from './entities/AppRecord.entity';

// Default port is 5435 when running on host machine (to match exposed Docker port 5435),
// or 5432 when running inside container network (DB_HOST=postgres).
const defaultPort = process.env.DB_HOST === 'postgres' ? '5432' : '5435';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || defaultPort, 10),
  username: process.env.DB_USER || 'calcversa_user',
  password: process.env.DB_PASSWORD || 'calcversa_pass',
  database: process.env.DB_NAME || 'calcversa',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, App, UsersNAppMapping, Permission, UserPermission, AppRecord],
  migrations: [],
  subscribers: [],
});
