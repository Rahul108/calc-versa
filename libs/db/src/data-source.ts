import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/User.entity';
import { App } from './entities/App.entity';
import { UsersNAppMapping } from './entities/UsersNAppMapping.entity';
import { Permission } from './entities/Permission.entity';
import { UserPermission } from './entities/UserPermission.entity';
import { AppRecord } from './entities/AppRecord.entity';
import { SchemaUpdate1787934189939 } from './migrations/1787934189939-SchemaUpdate';
import { AddUserIsAdmin1790000000000 } from './migrations/1790000000000-AddUserIsAdmin';
import { AppOwnershipAndScopedNames1795132800000 } from './migrations/1795132800000-AppOwnershipAndScopedNames';

// Default port is 5435 when running on host machine (to match exposed Docker port 5435),
// or 5432 when running inside container network (DB_HOST=postgres).
const defaultPort = process.env.DB_HOST === 'postgres' ? '5432' : '5435';

export const ENTITIES = [User, App, UsersNAppMapping, Permission, UserPermission, AppRecord];

/** Migrations in order. Add new ones here (class references work under ts-node and compiled builds). */
export const MIGRATIONS = [
  SchemaUpdate1787934189939,
  AddUserIsAdmin1790000000000,
  AppOwnershipAndScopedNames1795132800000,
];

/**
 * Shared connection options for the API Gateway, CLI and seeds.
 *
 * The schema is managed by migrations in every environment. `DB_SYNCHRONIZE=true`
 * re-enables TypeORM auto-sync for throwaway local experiments only.
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || defaultPort, 10),
  username: process.env.DB_USER || 'calcversa_user',
  password: process.env.DB_PASSWORD || 'calcversa_pass',
  database: process.env.DB_NAME || 'calcversa',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.NODE_ENV === 'development',
  entities: ENTITIES,
  migrations: MIGRATIONS,
  migrationsTableName: 'migrations',
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);
