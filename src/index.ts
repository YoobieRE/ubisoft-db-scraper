import 'source-map-support/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import schedule from 'node-schedule';
import { config } from './common/config';
import DemuxPool from './demux/pool';
import DbScraper from './demux/db-scraper';
import logger from './common/logger';
import ProductGitArchive from './reports/product-git';

let locked = false;

async function scrape(target: 'config' | 'manifest'): Promise<void> {
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
    const ownershipPool = await demuxPool.getOwnershipPool();

    const scraper = new DbScraper({
      ownershipPool,
      logger,
      maxProductId: config.maxProductId,
      productIdChunkSize: config.productIdChunkSize,
    });

    try {
      if (target === 'config') {
        await scraper.scrapeConfigurations();
      } else {
        await scraper.scrapeManifests();
      }
    } catch (err) {
      logger.error(err);
    }

    await demuxPool.destroy();

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

logger.debug({ config }, 'Found config');

if (config.noSchedule) {
  scrape('manifest');
} else {
  logger.info('Started, scheduling scraping jobs');
  schedule.scheduleJob('1 * * * *', () => scrape('manifest'));
  schedule.scheduleJob('0 0 * * *', () => scrape('config'));
}
