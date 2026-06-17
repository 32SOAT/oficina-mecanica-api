import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseOptions } from '../config/env/database.config';

dotenv.config();

const options = getDatabaseOptions() as DataSourceOptions;

export const AppDataSource = new DataSource({
  ...options,
  entities: [path.join(__dirname, '..', '**', '*.entity.{js,ts}')],
  migrations: [path.join(__dirname, 'migrations', '*.{js,ts}')],
});
