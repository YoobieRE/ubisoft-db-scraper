import fs from 'fs-extra';
import path from 'path';

export interface Account {
  email: string;
  password: string;
  totp?: string;
}

export interface ConfigFile {
  accounts: Account[];
  logLevel?: string;
  githubToken: string;
  gitUser: string;
  gitEmail: string;
  productArchiveRemote: string;
  dbConnectionString: string;
  noSchedule?: boolean;
  maxProductId?: number;
  noPush?: boolean;
}

export const configDir = process.env.CONFIG_DIR || './config';

export const config: ConfigFile = fs.readJSONSync(path.join(configDir, 'config.json'));
