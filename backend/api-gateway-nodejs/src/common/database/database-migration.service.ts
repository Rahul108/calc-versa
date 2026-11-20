import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { runMigrationsWithBaseline } from '../../db';

/**
 * Applies pending migrations before the gateway starts accepting requests
 * (Nest awaits bootstrap hooks before `listen`). A failure aborts start-up.
 *
 * Set DB_MIGRATIONS_RUN=false when migrations are applied by a separate
 * deploy step (`npm run migration:run` in libs/db).
 */
@Injectable()
export class DatabaseMigrationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseMigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    if (process.env.DB_MIGRATIONS_RUN === 'false') {
      this.logger.log('DB_MIGRATIONS_RUN=false: skipping automatic migrations');
      return;
    }
    const ran = await runMigrationsWithBaseline(this.dataSource);
    this.logger.log(
      ran.length ? `Applied migrations: ${ran.join(', ')}` : 'Database schema is up to date',
    );
  }
}
