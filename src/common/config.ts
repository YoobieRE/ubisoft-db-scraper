import fs from 'fs-extra';
import path from 'path';
import type { Level } from 'pino';
import { DiscordChannelWebhookList } from '../reports/discord';

export interface Account {
  email: string;
  password: string;
  totp?: string;
}

export interface ConfigFile {
  accounts: Account[];
  discordBotAccount: Account;
  storeListenerAccount: Account;
  discordBotToken: string;
  discordTestGuild?: string;
  logLevel?: Level;
  fileLogLevel?: Level;
  githubToken: string;
  gitUser: string;
  gitEmail: string;
  productArchiveRemote: string;
  manifestVersionsRemote: string;
  dbConnectionString: string;
  noSchedule?: boolean;
  maxProductId?: number;
  noPush?: boolean;
  throttleTime?: number;
  productIdChunkSize?: number;
  demuxTimeout?: number;
  connectionLog?: boolean;
  discordWebhooks: DiscordChannelWebhookList;
  webhookDisabled?: boolean;
}

export const configDir = process.env.CONFIG_DIR || './config';

export const config: ConfigFile = fs.readJSONSync(path.join(configDir, 'config.json'));
