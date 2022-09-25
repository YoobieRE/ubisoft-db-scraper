import 'source-map-support/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import schedule from 'node-schedule';
import { config } from './common/config';
import DemuxPool from './demux/pool';
import DbScraper from './demux/db-scraper';
import LauncherScraper from './demux/launcher-scraper';
import logger from './common/logger';
import ProductGitArchive from './reports/product-git';
import DiscordReporter from './reports/discord';
import { DiscordBot } from './bot/discord-bot';
import StoreListener from './demux/store-listener';

logger.debug({ config }, 'Found config');

const discordReporter = new DiscordReporter({
  channelWebhooks: config.discordWebhooks,
  logger,
});

let locked = false;

async function scrape(target: 'config' | 'store'): Promise<void> {
  if (locked) return;
  locked = true;

  logger.info(`Beginning scrape for target: ${target}`);
  try {
    const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
      autoIndex: false,
    });

    const demuxPool = new DemuxPool({
      accounts: config.accounts,
      logger,
      throttleTime: config.throttleTime,
      demuxTimeout: config.demuxTimeout,
    });

    const launcherScraper = new LauncherScraper({
      logger,
    });

    try {
      const connectionPool = await demuxPool.getConnectionPool();
      const dbScraper = new DbScraper({
        connectionPool,
        logger,
        maxProductId: config.maxProductId,
        productIdChunkSize: config.productIdChunkSize,
      });
      dbScraper.on('productUpdate', discordReporter.sendProductUpdates.bind(discordReporter));

      if (target === 'config') {
        await dbScraper.scrapeConfigurations();
      } else {
        await dbScraper.scrapeStore();
      }

      // Get launcher data
      launcherScraper.on(
        'launcherUpdate',
        discordReporter.sendLauncherUpdate.bind(discordReporter)
      );
      await launcherScraper.scrapeLauncherVersion();
    } catch (err) {
      logger.error(err);
    }
    await demuxPool.destroy();
    await launcherScraper.destroy();

    const productArchive = new ProductGitArchive({
      logger,
      remote: config.productArchiveRemote,
      token: config.githubToken,
      userName: config.gitUser,
      userEmail: config.gitEmail,
    });
    await productArchive.archive();

    await mongooseConnection.disconnect();
  } catch (err) {
    logger.error(err);
  }
  locked = false;
}

async function main(): Promise<void> {
  const storeListener = new StoreListener({ account: config.storeListenerAccount, logger });
  await storeListener.listenForUpdates();
  storeListener.on(
    'revisionProductRemoved',
    discordReporter.sendStoreRevisionProductRemoved.bind(discordReporter)
  );
  storeListener.on(
    'revisionProductUpdate',
    discordReporter.sendStoreRevisionProductUpdate.bind(discordReporter)
  );
  storeListener.on(
    'storeProductRemoved',
    discordReporter.sendStoreProductRemoved.bind(discordReporter)
  );
  storeListener.on(
    'storeProductUpdate',
    discordReporter.sendStoreProductUpdate.bind(discordReporter)
  );

  if (config.discordBotToken) {
    DiscordBot.build({
      botToken: config.discordBotToken,
      ubiAccount: config.discordBotAccount,
      testGuildId: config.discordTestGuild,
      logger,
    });
  }

  if (config.noSchedule) {
    await scrape('store');
  } else {
    logger.info('Started, scheduling scraping jobs');
    schedule.scheduleJob('1 * * * *', () => scrape('store'));
    schedule.scheduleJob('0 0 * * *', () => scrape('config'));
  }
}

main().catch(logger.error);
