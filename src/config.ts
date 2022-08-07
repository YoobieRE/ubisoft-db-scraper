import fs from 'fs-extra';

export interface Account {
  email: string;
  password: string;
  totp?: string;
}

export interface ConfigFile {
  accounts: Account[];
  logLevel?: string;
}

export const config: ConfigFile = fs.readJSONSync('config.json');
