import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseOptions } from './database.config';

dotenv.config();

const options = getDatabaseOptions() as DataSourceOptions;

export const AppDataSource = new DataSource({
  ...options,
  entities: [path.join(__dirname, '..', '**', '*.entity.{js,ts}')],
  migrations: [
    path.join(__dirname, '..', 'database', 'migrations', '*.{js,ts}'),
  ],
});
