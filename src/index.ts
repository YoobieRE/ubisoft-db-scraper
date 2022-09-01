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
import ManifestVersionsGit from './reports/manifest-version-git';

let locked = false;

async function scrape(target: 'config' | 'manifest'): Promise<void> {
  if (locked) return;
  locked = true;

  logger.info(`Beginning scrape for target: ${target}`);
  try {
    const mongooseConnection = await mongoose.connect(config.dbConnectionString, {
      autoIndex: false,
    });

    const discordReporter = new DiscordReporter({
      channelWebhooks: config.discordWebhooks,
      logger,
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
      const ownershipPool = await demuxPool.getOwnershipPool();
      const dbScraper = new DbScraper({
        ownershipPool,
        logger,
        maxProductId: config.maxProductId,
        productIdChunkSize: config.productIdChunkSize,
      });
      dbScraper.on('configUpdate', discordReporter.sendProductUpdates.bind(discordReporter));

      if (target === 'config') {
        await dbScraper.scrapeConfigurations();
      } else {
        await dbScraper.scrapeManifests();
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
    const manifestVersions = new ManifestVersionsGit({
      logger,
      remote: config.manifestVersionsRemote,
      token: config.githubToken,
      userName: config.gitUser,
      userEmail: config.gitEmail,
    });
    await manifestVersions.archive();

    await mongooseConnection.disconnect();
  } catch (err) {
    logger.error(err);
  }
  locked = false;
}

logger.debug({ config }, 'Found config');

if (config.noSchedule) {
  scrape('config');
} else {
  logger.info('Started, scheduling scraping jobs');
  // schedule.scheduleJob('1 * * * *', () => scrape('manifest'));
  schedule.scheduleJob('0 1/2 * * *', () => scrape('config'));
}
